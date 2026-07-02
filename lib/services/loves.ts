import { and, count, eq, inArray } from "drizzle-orm";
import { loves } from "@/lib/db/schema";
import type { Database } from "@/lib/types";

/**
 * Set (or clear) a session's love for a video and return the fresh total. The
 * insert is idempotent via the unique (video, session) index, so a double-tap
 * or a stale client can't inflate the count; clearing removes the one row.
 * The server-returned count is authoritative — the client reconciles its
 * optimistic guess against it.
 */
export async function setLove(
  db: Database,
  videoId: string,
  sessionId: string,
  loved: boolean,
): Promise<number> {
  if (loved) {
    await db.insert(loves).values({ videoId, sessionId }).onConflictDoNothing();
  } else {
    await db
      .delete(loves)
      .where(and(eq(loves.videoId, videoId), eq(loves.sessionId, sessionId)));
  }
  return getLoveCount(db, videoId);
}

/** Total loves for a single video. */
export async function getLoveCount(
  db: Database,
  videoId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(loves)
    .where(eq(loves.videoId, videoId));
  return Number(row?.count ?? 0);
}

/** Whether this session has loved the video (for reconciling client state). */
export async function hasLoved(
  db: Database,
  videoId: string,
  sessionId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: loves.id })
    .from(loves)
    .where(and(eq(loves.videoId, videoId), eq(loves.sessionId, sessionId)))
    .limit(1);
  return Boolean(row);
}

/**
 * Love counts for a set of videos in one grouped query (N+1-free), for the
 * creator dashboard. Videos with zero loves are simply absent from the map.
 */
export async function getLoveCountsByVideo(
  db: Database,
  videoIds: string[],
): Promise<Map<string, number>> {
  if (videoIds.length === 0) return new Map();
  const rows = await db
    .select({ videoId: loves.videoId, count: count() })
    .from(loves)
    .where(inArray(loves.videoId, videoIds))
    .groupBy(loves.videoId);
  return new Map(rows.map((r) => [r.videoId, Number(r.count)]));
}
