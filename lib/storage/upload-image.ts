"use client";

import { BUCKET, publicUrl } from "./paths";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Upload a small image (a poster frame or creator-picked key art) straight to
 * Storage. Posters are tiny, so a plain one-shot upload is enough — no need for
 * the resumable TUS path the video source uses. Overwrites in place (`x-upsert`)
 * and returns a cache-busted public URL so the new poster shows immediately.
 */
export async function uploadPosterImage(
  videoId: string,
  blob: Blob,
): Promise<string> {
  if (!SUPABASE_URL || !PUBLISHABLE_KEY) {
    throw new Error("Supabase env not configured for uploads");
  }

  const path = `${videoId}/poster.jpg`;
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${PUBLISHABLE_KEY}`,
        apikey: PUBLISHABLE_KEY,
        "x-upsert": "true",
        "content-type": blob.type || "image/jpeg",
      },
      body: blob,
    },
  );
  if (!res.ok) {
    throw new Error(`Poster upload failed (${res.status})`);
  }

  // Cache-bust: the object path is stable across re-uploads, so without this the
  // browser/CDN would serve the previous poster.
  return `${publicUrl(SUPABASE_URL, path)}?v=${Date.now()}`;
}
