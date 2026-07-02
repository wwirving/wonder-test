import { and, asc, eq, inArray } from "drizzle-orm";
import { clips, type Clip, type NewClip } from "@/lib/db/schema";
import type { Database } from "@/lib/types";

export async function createClip(
  db: Database,
  input: NewClip,
): Promise<Clip> {
  const [row] = await db.insert(clips).values(input).returning();
  return row;
}

export async function listClipsByVideo(
  db: Database,
  videoId: string,
): Promise<Clip[]> {
  return db
    .select()
    .from(clips)
    .where(eq(clips.videoId, videoId))
    .orderBy(asc(clips.startS));
}

/** Toggle whether a clip is featured (kept by the creator to surface). */
export async function setClipFeatured(
  db: Database,
  id: string,
  featured: boolean,
): Promise<void> {
  await db.update(clips).set({ featured }).where(eq(clips.id, id));
}

/** Persist a clip's generated still-frame thumbnail URL. */
export async function setClipPoster(
  db: Database,
  id: string,
  posterUrl: string,
): Promise<void> {
  await db.update(clips).set({ posterUrl }).where(eq(clips.id, id));
}

/**
 * Featured clips for many videos in one query — batched to avoid an N+1 on the
 * discover feed. Returns them grouped by videoId, each list ordered by start.
 */
export async function listFeaturedClipsForVideos(
  db: Database,
  videoIds: string[],
): Promise<Map<string, Clip[]>> {
  const grouped = new Map<string, Clip[]>();
  if (videoIds.length === 0) return grouped;
  const rows = await db
    .select()
    .from(clips)
    .where(and(inArray(clips.videoId, videoIds), eq(clips.featured, true)))
    .orderBy(asc(clips.startS));
  for (const row of rows) {
    const list = grouped.get(row.videoId);
    if (list) list.push(row);
    else grouped.set(row.videoId, [row]);
  }
  return grouped;
}

export async function deleteClip(db: Database, id: string): Promise<boolean> {
  const rows = await db
    .delete(clips)
    .where(eq(clips.id, id))
    .returning({ id: clips.id });
  return rows.length > 0;
}
