import type { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb } from "@/lib/db/test-utils";
import type { Database } from "@/lib/db/types";
import { getCreatorDashboard, getVideoAnalytics } from "./analytics";
import { createVideo } from "./videos";
import { recordWatchEvent } from "./watch-events";

let db: Database;
let client: PGlite;

beforeEach(async () => {
  ({ db, client } = await makeTestDb());
});
afterEach(async () => {
  await client.close();
});

async function watch(videoId: string, sessionId: string, pct: number) {
  await recordWatchEvent(db, {
    videoId,
    sessionId,
    watchedSeconds: pct,
    videoDuration: 100,
  });
}

describe("getVideoAnalytics", () => {
  it("computes views, mean pct (generated col), mean seconds, completion rate", async () => {
    const v = await createVideo(db, { title: "A", genre: ["Drama"] });
    // three watches of a 100s film: 100%, 50%, 95%
    await watch(v.id, "s1", 100);
    await watch(v.id, "s2", 50);
    await watch(v.id, "s3", 95);

    const a = await getVideoAnalytics(db, v.id);
    expect(a.views).toBe(3);
    expect(a.meanPctWatched).toBeCloseTo((1 + 0.5 + 0.95) / 3, 5);
    expect(a.meanSecondsPlayed).toBeCloseTo((100 + 50 + 95) / 3, 5);
    // only the 100% and 95% watches clear the 0.9 threshold
    expect(a.completionRate).toBeCloseTo(2 / 3, 5);
  });

  it("returns zeroed metrics for a video with no watches", async () => {
    const v = await createVideo(db, { title: "B", genre: ["Drama"] });
    const a = await getVideoAnalytics(db, v.id);
    expect(a).toMatchObject({
      views: 0,
      meanPctWatched: 0,
      meanSecondsPlayed: 0,
      completionRate: 0,
    });
  });
});

describe("getCreatorDashboard", () => {
  it("returns one row per video (incl. zero-watch) plus totals", async () => {
    const watched = await createVideo(db, { title: "Watched", genre: ["Drama"] });
    const unwatched = await createVideo(db, { title: "Unwatched", genre: ["Comedy"] });
    await watch(watched.id, "s1", 100);
    await watch(watched.id, "s2", 40);

    const { perVideo, totals } = await getCreatorDashboard(db);
    expect(perVideo).toHaveLength(2);

    const w = perVideo.find((r) => r.videoId === watched.id)!;
    expect(w.views).toBe(2);
    expect(w.meanPctWatched).toBeCloseTo(0.7, 5);
    expect(w.completionRate).toBeCloseTo(0.5, 5); // only the 100% watch completes

    const u = perVideo.find((r) => r.videoId === unwatched.id)!;
    expect(u.views).toBe(0);
    expect(u.completionRate).toBe(0);

    expect(totals).toEqual({ videos: 2, views: 2 });
  });
});
