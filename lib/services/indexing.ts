/**
 * The Twelve Labs indexing reconciler — the single, idempotent brain behind
 * enrichment. Every trigger (post-upload hook, editor page load, client poll)
 * routes through these two functions, so indexing is inherently de-duped and
 * self-healing: it starts the moment bytes are in Storage, and any later trigger
 * that finds the video un-indexed or mid-flight simply advances it.
 *
 *   ensureIndexing   — start indexing exactly once (atomic claim + TL kickoff)
 *   reconcileIndexing — advance a running video toward ready/failed, persisting
 *                       the /analyze outputs when the index is ready
 *
 * Both are safe to call repeatedly and concurrently. See the individual docs for
 * the guards (atomic status claim; row lock on the completion write).
 */
import { and, asc, eq, isNull } from "drizzle-orm";
import { clips, videos } from "@/lib/db/schema";
import type { Database } from "@/lib/types";
import { getVideo, setAiStatus, updateVideo } from "@/lib/services/videos";
import { classifyIndexingError } from "@/lib/services/indexing-errors";
import {
  analyzeClips,
  analyzeTags,
  createIndexingTask,
  getTask,
  TL_FAILED,
  TL_READY,
} from "@/lib/services/twelve-labs";
import type { AiTagSuggestions, SuggestedClip } from "@/lib/twelve-labs/types";

const isTerminal = (s: string) => s === "ready" || s === "failed";

// How long a video may sit `processing` with no task id before the reconciler
// treats it as a crashed kickoff and resets it. Comfortably longer than the
// createIndexingTask round-trip, so the normal claim→persist window is never
// mistaken for a crash.
const STALE_KICKOFF_MS = 60_000;

/** What the editor needs to render the enrichment surfaces on load / each poll. */
export type EnrichmentState = {
  aiTagsStatus: (typeof videos.aiTagsStatus.enumValues)[number];
  aiClipsStatus: (typeof videos.aiClipsStatus.enumValues)[number];
  suggestions: AiTagSuggestions | null;
  clips: SuggestedClip[];
  /** Ids of the clips the creator is currently featuring (persisted selection). */
  featuredClipIds: string[];
  /** Why enrichment permanently failed (null unless a status is `failed`). */
  indexingError: string | null;
};

/**
 * Start indexing this video exactly once.
 *
 * The atomic claim (`SET ...processing WHERE ai_tags_status = 'pending'`) is the
 * de-dup guard: only the caller whose UPDATE returns a row proceeds to hit
 * Twelve Labs, so overlapping triggers (upload hook + page load + poll) can't
 * double-index. A failed TL call is classified: a definite 4xx rejection (e.g.
 * resolution out of range) can never succeed on retry, so the video goes
 * straight to `failed` with the reason persisted for the editor; anything else
 * (network, 5xx, rate limit) rolls the claim back to `pending` so a later
 * trigger retries. No-ops if the video is missing, has no uploaded bytes yet,
 * or has already moved past `pending`.
 */
export async function ensureIndexing(
  db: Database,
  videoId: string,
): Promise<void> {
  const video = await getVideo(db, videoId);
  // Bytes must be in Storage first — TL pulls the public URL on its own infra.
  if (!video?.storagePath) return;

  const claimed = await db
    .update(videos)
    .set({
      aiTagsStatus: "processing",
      aiClipsStatus: "processing",
      indexingStartedAt: new Date(),
      indexingError: null,
    })
    .where(and(eq(videos.id, videoId), eq(videos.aiTagsStatus, "pending")))
    .returning({ id: videos.id });
  if (claimed.length === 0) return; // someone else owns it / already started

  try {
    const handle = await createIndexingTask({
      videoUrl: video.storagePath,
      externalId: videoId,
    });
    await updateVideo(db, videoId, {
      tlTaskId: handle.taskId,
      tlVideoId: handle.videoId,
    });
  } catch (err) {
    const { permanent, reason } = classifyIndexingError(err);
    console.error(
      `[indexing] kickoff failed for video ${videoId} ` +
        `(${permanent ? `permanent: ${reason}` : "transient, will retry"})`,
      err,
    );
    if (permanent) {
      // The video itself is un-indexable — park it as failed with the reason.
      // Guarded on our own claim (still processing, no task id) so we never
      // clobber a row the stale-kickoff recovery already reset and re-kicked.
      await db
        .update(videos)
        .set({
          aiTagsStatus: "failed",
          aiClipsStatus: "failed",
          indexingError: reason,
        })
        .where(
          and(
            eq(videos.id, videoId),
            eq(videos.aiTagsStatus, "processing"),
            isNull(videos.tlTaskId),
          ),
        );
      return;
    }
    // Transient — roll the claim back so the next trigger retries cleanly.
    await db
      .update(videos)
      .set({
        aiTagsStatus: "pending",
        aiClipsStatus: "pending",
        indexingStartedAt: null,
        indexingError: null,
      })
      .where(eq(videos.id, videoId));
  }
}

/**
 * Advance a running video toward its terminal state, populating fields when the
 * index is ready. Idempotent and concurrency-safe:
 *
 * - Slow TL network calls (task status + `/analyze`) run OUTSIDE any transaction
 *   so we never hold a DB/pooler connection across the network.
 * - The completion write takes a `SELECT ... FOR UPDATE` row lock and re-checks
 *   status inside it, so two concurrent polls can't both write clips (the second
 *   sees `ready` and skips). Worst case under a race is a wasted `/analyze` call,
 *   never a duplicate row.
 * - Crash recovery: a video stuck `processing` with no `tlTaskId` (killed
 *   between the claim and persisting the id) is reset to `pending` for
 *   `ensureIndexing` to restart.
 */
export async function reconcileIndexing(
  db: Database,
  videoId: string,
): Promise<void> {
  const video = await getVideo(db, videoId);
  if (!video) return;
  if (isTerminal(video.aiTagsStatus) && isTerminal(video.aiClipsStatus)) return;

  // Claimed (processing) but no task id yet. Normally this is the brief window
  // between the claim and persisting the id — leave it alone. Only if it has
  // been stuck past STALE_KICKOFF_MS do we treat it as a crashed kickoff and
  // reset to pending for `ensureIndexing` to restart. This is what keeps a
  // page-load `ensureIndexing` racing an immediate poll from double-indexing.
  if (!video.tlTaskId) {
    const startedAt = video.indexingStartedAt?.getTime() ?? 0;
    const stale = Date.now() - startedAt > STALE_KICKOFF_MS;
    if (
      stale &&
      (video.aiTagsStatus === "processing" ||
        video.aiClipsStatus === "processing")
    ) {
      await db
        .update(videos)
        .set({
          aiTagsStatus: "pending",
          aiClipsStatus: "pending",
          indexingStartedAt: null,
          indexingError: null,
        })
        .where(eq(videos.id, videoId));
    }
    return;
  }

  const task = await getTask(video.tlTaskId);

  // Backfill the resolved TL video id as soon as it appears.
  const tlVideoId = video.tlVideoId ?? task.videoId;
  if (!video.tlVideoId && task.videoId) {
    await updateVideo(db, videoId, { tlVideoId: task.videoId });
  }

  if (task.status === TL_FAILED) {
    console.error(
      `[indexing] Twelve Labs task ${video.tlTaskId} failed for video ${videoId}`,
    );
    await db
      .update(videos)
      .set({
        aiTagsStatus: "failed",
        aiClipsStatus: "failed",
        indexingError: "Twelve Labs could not index this video.",
      })
      .where(eq(videos.id, videoId));
    return;
  }
  if (task.status !== TL_READY || !tlVideoId) return; // still indexing

  // Run analysis outside any lock/txn (network-bound, several seconds).
  const [tags, suggestedClips] = await Promise.all([
    isTerminal(video.aiTagsStatus)
      ? Promise.resolve<AiTagSuggestions | null>(null)
      : analyzeTags(tlVideoId).catch(() => "error" as const),
    isTerminal(video.aiClipsStatus)
      ? Promise.resolve<SuggestedClip[] | null>(null)
      : analyzeClips(tlVideoId).catch(() => "error" as const),
  ]);

  // Serialise the commit on the row so concurrent polls can't double-write.
  await db.transaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(videos)
      .where(eq(videos.id, videoId))
      .for("update");
    if (!locked) return;

    if (!isTerminal(locked.aiTagsStatus)) {
      if (tags === "error") {
        await setAiStatus(tx, videoId, "aiTagsStatus", "failed");
      } else if (tags) {
        await updateVideo(tx, videoId, { aiSuggestions: tags });
        await setAiStatus(tx, videoId, "aiTagsStatus", "ready");
      }
    }

    if (!isTerminal(locked.aiClipsStatus)) {
      if (suggestedClips === "error") {
        await setAiStatus(tx, videoId, "aiClipsStatus", "failed");
      } else if (suggestedClips) {
        // Idempotent replace of this video's AI clips.
        await tx.delete(clips).where(eq(clips.videoId, videoId));
        if (suggestedClips.length > 0) {
          await tx.insert(clips).values(
            suggestedClips.map((c) => ({
              videoId,
              startS: c.startS,
              endS: c.endS,
              label: c.label || null,
            })),
          );
        }
        await setAiStatus(tx, videoId, "aiClipsStatus", "ready");
      }
    }
  });
}

/** Read the current enrichment state (statuses + persisted suggestions + clips). */
export async function getEnrichmentState(
  db: Database,
  videoId: string,
): Promise<EnrichmentState | null> {
  const video = await getVideo(db, videoId);
  if (!video) return null;
  const rows = await db
    .select()
    .from(clips)
    .where(eq(clips.videoId, videoId))
    .orderBy(asc(clips.startS));
  return {
    aiTagsStatus: video.aiTagsStatus,
    aiClipsStatus: video.aiClipsStatus,
    indexingError: video.indexingError ?? null,
    suggestions: video.aiSuggestions ?? null,
    clips: rows.map((c) => ({
      id: c.id,
      startS: c.startS,
      endS: c.endS,
      label: c.label ?? "",
      posterUrl: c.posterUrl,
    })),
    featuredClipIds: rows.filter((c) => c.featured).map((c) => c.id),
  };
}
