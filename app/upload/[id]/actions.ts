"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { publishVideo, updateVideo } from "@/lib/services/videos";
import { setClipFeatured, setClipPoster } from "@/lib/services/clips";
import {
  ensureIndexing,
  getEnrichmentState,
  reconcileIndexing,
  type EnrichmentState,
} from "@/lib/services/indexing";
import type { Credit, Video } from "@/lib/db/schema";

/**
 * The subset of a video row the editor is allowed to write. Everything else
 * (id, status, storagePath, runtime, AI statuses, timestamps) is owned by the
 * upload/publish/webhook paths — never by the metadata form.
 */
export type EditablePatch = {
  title: string;
  synopsis: string;
  director: string;
  credits: Credit[];
  genre: string[];
  moodTags: string[];
  tags: string[];
  posterUrl: string | null;
  accessTier: Video["accessTier"];
};

// Normalise the free-form form into storable columns: trim scalars, drop empty
// strings to null, and keep the array/jsonb fields as-is.
function toPatch(input: EditablePatch) {
  const clean = (s: string) => {
    const t = s.trim();
    return t.length ? t : null;
  };
  return {
    title: input.title.trim(),
    synopsis: clean(input.synopsis),
    director: clean(input.director),
    credits: input.credits,
    genre: input.genre,
    moodTags: input.moodTags,
    tags: input.tags,
    posterUrl: input.posterUrl,
    accessTier: input.accessTier,
  };
}

/** Persist the metadata form. Used for autosave and just before publish. */
export async function saveVideo(id: string, patch: EditablePatch): Promise<void> {
  await updateVideo(db, id, toPatch(patch));
}

/**
 * Save the current form, then flip the video live. Revalidates the discovery
 * feed and this video's watch page so the publish is visible immediately.
 * Publish is never gated by AI enrichment — a title is the only requirement.
 */
export async function publishVideoAction(
  id: string,
  patch: EditablePatch,
): Promise<Video | null> {
  await updateVideo(db, id, toPatch(patch));
  const row = await publishVideo(db, id);
  revalidatePath("/");
  revalidatePath(`/watch/${id}`);
  return row;
}

/** Lightweight poster persistence — used after a client-side frame grab/upload. */
export async function setPoster(id: string, posterUrl: string): Promise<void> {
  await updateVideo(db, id, { posterUrl });
}

/**
 * Persist whether a clip is featured. Called optimistically as the creator
 * toggles clips in the editor; the discover feed reads the featured set.
 */
export async function setClipFeaturedAction(
  clipId: string,
  featured: boolean,
): Promise<void> {
  await setClipFeatured(db, clipId, featured);
}

/** Persist a clip's generated still-frame thumbnail (captured in the browser). */
export async function setClipPosterAction(
  clipId: string,
  posterUrl: string,
): Promise<void> {
  await setClipPoster(db, clipId, posterUrl);
}

/**
 * Fire Twelve Labs indexing the moment the upload finishes (called from the
 * upload flow before the creator even reaches the editor). Idempotent — the
 * reconciler no-ops if indexing has already started.
 */
export async function startIndexing(id: string): Promise<void> {
  await ensureIndexing(db, id);
}

/**
 * The editor's polling heartbeat. Self-heals (starts indexing if it somehow
 * never began), advances the running task, and returns the current enrichment
 * state so the client can reveal suggestions/clips as they land. Replaces the
 * old mock timers.
 */
export async function pollIndexing(id: string): Promise<EnrichmentState | null> {
  await ensureIndexing(db, id);
  await reconcileIndexing(db, id);
  return getEnrichmentState(db, id);
}
