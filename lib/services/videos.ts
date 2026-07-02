import { and, desc, eq } from "drizzle-orm";
import { videos, type NewVideo, type Video } from "@/lib/db/schema";
import type { Database, ListVideosFilter } from "@/lib/types";

export async function createVideo(
  db: Database,
  input: NewVideo,
): Promise<Video> {
  const [row] = await db.insert(videos).values(input).returning();
  return row;
}

export async function getVideo(
  db: Database,
  id: string,
): Promise<Video | null> {
  const [row] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, id))
    .limit(1);
  return row ?? null;
}

export async function listVideos(
  db: Database,
  filter: ListVideosFilter = {},
): Promise<Video[]> {
  const conds = [];
  if (filter.status) conds.push(eq(videos.status, filter.status));

  return db
    .select()
    .from(videos)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(videos.createdAt))
    .limit(filter.limit ?? 50);
}

export async function updateVideo(
  db: Database,
  id: string,
  patch: Partial<NewVideo>,
): Promise<Video | null> {
  const [row] = await db
    .update(videos)
    .set(patch)
    .where(eq(videos.id, id))
    .returning();
  return row ?? null;
}

export async function publishVideo(
  db: Database,
  id: string,
): Promise<Video | null> {
  const [row] = await db
    .update(videos)
    .set({ status: "published" })
    .where(eq(videos.id, id))
    .returning();
  return row ?? null;
}

export async function deleteVideo(db: Database, id: string): Promise<boolean> {
  const rows = await db
    .delete(videos)
    .where(eq(videos.id, id))
    .returning({ id: videos.id });
  return rows.length > 0;
}

/**
 * Twelve Labs indexing-reconciler target — flips an AI processing status.
 * Idempotent single-column update, safe against overlapping reconcile passes
 * (see lib/services/indexing.ts).
 */
export async function setAiStatus(
  db: Database,
  id: string,
  field: "aiTagsStatus" | "aiClipsStatus",
  value: (typeof videos.aiTagsStatus.enumValues)[number],
): Promise<void> {
  await db
    .update(videos)
    .set({ [field]: value })
    .where(eq(videos.id, id));
}
