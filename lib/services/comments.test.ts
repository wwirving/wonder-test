import type { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { makeTestDb } from "@/lib/db/test-utils";
import type { Database } from "@/lib/db/types";
import { comments } from "@/lib/db/schema";
import { createVideo, deleteVideo } from "./videos";
import {
  addComment,
  countCommentsByVideo,
  countCommentsForVideo,
  listCommentsForVideo,
} from "./comments";

let db: Database;
let client: PGlite;
let videoId: string;

beforeEach(async () => {
  ({ db, client } = await makeTestDb());
  const v = await createVideo(db, { title: "V", genre: ["Drama"] });
  videoId = v.id;
});
afterEach(async () => {
  await client.close();
});

describe("addComment / listCommentsForVideo", () => {
  it("stores a comment with author name and returns it", async () => {
    const c = await addComment(db, {
      videoId,
      sessionId: "s1",
      authorName: "Ada",
      body: "Loved this.",
    });
    expect(c.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(c.authorName).toBe("Ada");
    expect(c.body).toBe("Loved this.");
  });

  it("allows a null author name (anonymous)", async () => {
    const c = await addComment(db, {
      videoId,
      sessionId: "s1",
      body: "Anon here.",
    });
    expect(c.authorName).toBeNull();
  });

  it("rejects an empty/whitespace body via the DB check", async () => {
    await expect(
      addComment(db, { videoId, sessionId: "s1", body: "   " }),
    ).rejects.toThrow();
  });

  it("lists comments newest-first", async () => {
    // Explicit timestamps: two inserts can share a microsecond in-memory, which
    // would make the createdAt-desc tie ambiguous.
    await addComment(db, {
      videoId,
      sessionId: "s1",
      body: "first",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
    await addComment(db, {
      videoId,
      sessionId: "s1",
      body: "second",
      createdAt: new Date("2026-01-01T00:00:01Z"),
    });
    const list = await listCommentsForVideo(db, videoId);
    expect(list.map((c) => c.body)).toEqual(["second", "first"]);
  });

  it("cascades deletes when the parent video is removed", async () => {
    await addComment(db, { videoId, sessionId: "s1", body: "bye" });
    await deleteVideo(db, videoId);
    const remaining = await db
      .select()
      .from(comments)
      .where(eq(comments.videoId, videoId));
    expect(remaining).toHaveLength(0);
  });
});

describe("comment counts", () => {
  it("counts comments for a single video", async () => {
    expect(await countCommentsForVideo(db, videoId)).toBe(0);
    await addComment(db, { videoId, sessionId: "s1", body: "a" });
    await addComment(db, { videoId, sessionId: "s2", body: "b" });
    expect(await countCommentsForVideo(db, videoId)).toBe(2);
  });

  it("counts comments across the catalogue keyed by video id", async () => {
    const other = await createVideo(db, { title: "W", genre: ["Drama"] });
    await addComment(db, { videoId, sessionId: "s1", body: "a" });
    await addComment(db, { videoId, sessionId: "s2", body: "b" });
    await addComment(db, { videoId: other.id, sessionId: "s3", body: "c" });

    const counts = await countCommentsByVideo(db);
    expect(counts.get(videoId)).toBe(2);
    expect(counts.get(other.id)).toBe(1);
  });
});
