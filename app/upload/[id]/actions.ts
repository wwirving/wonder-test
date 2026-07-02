"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { publishVideo, updateVideo } from "@/lib/services/videos";
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
