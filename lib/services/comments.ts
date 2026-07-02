import { count, desc, eq } from "drizzle-orm";
import { comments, type Comment, type NewComment } from "@/lib/db/schema";
import type { Database } from "@/lib/types";

/** Newest-first comments for a single video, capped so the page stays light. */
export async function listCommentsForVideo(
  db: Database,
  videoId: string,
  limit = 200,
): Promise<Comment[]> {
  return db
    .select()
    .from(comments)
    .where(eq(comments.videoId, videoId))
    .orderBy(desc(comments.createdAt))
    .limit(limit);
}

/**
 * Persist one community comment. `body` non-emptiness is enforced by the DB
 * check constraint too, but callers (the route) trim/validate first.
 */
export async function addComment(
  db: Database,
  input: NewComment,
): Promise<Comment> {
  const [row] = await db.insert(comments).values(input).returning();
  return row;
}

/** Comment count for one video — the per-video analytics figure. */
export async function countCommentsForVideo(
  db: Database,
  videoId: string,
): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(comments)
    .where(eq(comments.videoId, videoId));
  return Number(row?.n ?? 0);
}

/**
 * Comment counts for the whole catalogue in one grouped query (N+1-free), keyed
 * by video id. Videos with no comments are simply absent from the map (→ 0).
 */
export async function countCommentsByVideo(
  db: Database,
): Promise<Map<string, number>> {
  const rows = await db
    .select({ videoId: comments.videoId, n: count() })
    .from(comments)
    .groupBy(comments.videoId);
  return new Map(rows.map((r) => [r.videoId, Number(r.n)]));
}
