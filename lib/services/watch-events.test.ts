import type { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb } from "@/lib/db/test-utils";
import type { Database } from "@/lib/db/types";
import { eq } from "drizzle-orm";
import { watchEvents } from "@/lib/db/schema";
import { createVideo, deleteVideo } from "./videos";
import { recordWatchEvent } from "./watch-events";

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

describe("recordWatchEvent", () => {
  it("inserts and computes pct_watched from the generated column", async () => {
    const e = await recordWatchEvent(db, {
      videoId,
      sessionId: "s1",
      watchedSeconds: 45,
      videoDuration: 90,
    });
    expect(e.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(e.pctWatched).toBeCloseTo(0.5, 5);
  });

  it("caps pct_watched at 1.0 on over-watch (rewind/loop)", async () => {
    const e = await recordWatchEvent(db, {
      videoId,
      sessionId: "s1",
      watchedSeconds: 200,
      videoDuration: 100,
    });
    expect(e.pctWatched).toBe(1);
  });

  it("rejects a non-positive duration via the DB check", async () => {
    await expect(
      recordWatchEvent(db, {
        videoId,
        sessionId: "s1",
        watchedSeconds: 0,
        videoDuration: 0,
      }),
    ).rejects.toThrow();
  });

  it("cascades deletes when the parent video is removed", async () => {
    await recordWatchEvent(db, {
      videoId,
      sessionId: "s1",
      watchedSeconds: 10,
      videoDuration: 100,
    });
    // FK is ON DELETE CASCADE — deleting the video clears its events.
    await deleteVideo(db, videoId);
    const remaining = await db
      .select()
      .from(watchEvents)
      .where(eq(watchEvents.videoId, videoId));
    expect(remaining).toHaveLength(0);
  });
});
