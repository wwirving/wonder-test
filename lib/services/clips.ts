import { asc, eq } from "drizzle-orm";
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

export async function deleteClip(db: Database, id: string): Promise<boolean> {
  const rows = await db
    .delete(clips)
    .where(eq(clips.id, id))
    .returning({ id: clips.id });
  return rows.length > 0;
}
