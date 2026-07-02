import type { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb } from "@/lib/db/test-utils";
import type { Database } from "@/lib/db/types";
import {
  getCreatorDashboard,
  getCreatorDashboardView,
  getVideoAnalytics,
} from "./analytics";
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

    // both videos are drafts (createVideo defaults to draft); views-weighted
    // retention == the watched video's mean since the other has no watches.
    expect(totals.videos).toBe(2);
    expect(totals.drafts).toBe(2);
    expect(totals.views).toBe(2);
    expect(totals.meanPctWatched).toBeCloseTo(0.7, 5);
    expect(totals.completionRate).toBeCloseTo(0.5, 5);
  });

  it("sums views across videos and views-weights retention (not a naive mean)", async () => {
    // A: 3 watches 100/80/60 → mean .80, 1 completes
    // B: 1 watch  90        → mean .90, 1 completes
    // C: 0 watches          → contributes nothing
    const a = await createVideo(db, { title: "A", status: "published" });
    const b = await createVideo(db, { title: "B", status: "published" });
    await createVideo(db, { title: "C", status: "published" });
    await watch(a.id, "a1", 100);
    await watch(a.id, "a2", 80);
    await watch(a.id, "a3", 60);
    await watch(b.id, "b1", 90);

    const { perVideo, totals } = await getCreatorDashboard(db);

    // per-video rolls up independently
    expect(perVideo.find((r) => r.videoId === a.id)!.views).toBe(3);
    expect(perVideo.find((r) => r.videoId === b.id)!.views).toBe(1);

    // totals are the SUM across videos, not any single one
    expect(totals.videos).toBe(3);
    expect(totals.views).toBe(4); // 3 + 1 + 0

    // views-weighted global mean = Σ(pct)/Σ(views) = (1+.8+.6+.9)/4 = 0.825.
    // A naive average of per-video means would be (.8+.9+0)/3 ≈ 0.567 — assert
    // we did NOT do that.
    expect(totals.meanPctWatched).toBeCloseTo(0.825, 5);
    expect(totals.meanPctWatched).not.toBeCloseTo((0.8 + 0.9 + 0) / 3, 2);

    // completion = Σ(completed)/Σ(views) = (1 + 1 + 0) / 4 = 0.5
    expect(totals.completionRate).toBeCloseTo(0.5, 5);

    // watch time is likewise views-weighted: Σ(seconds)/Σ(views)
    // = (100 + 80 + 60 + 90) / 4 = 82.5
    expect(totals.meanSecondsPlayed).toBeCloseTo(82.5, 5);
  });

  it("counts published vs draft and zeroes global retention with no views", async () => {
    const draft = await createVideo(db, { title: "Draft", genre: ["Drama"] });
    await createVideo(db, {
      title: "Live",
      genre: ["Comedy"],
      status: "published",
    });
    void draft;

    const { totals } = await getCreatorDashboard(db);
    expect(totals.videos).toBe(2);
    expect(totals.drafts).toBe(1);
    expect(totals.views).toBe(0);
    expect(totals.meanPctWatched).toBe(0);
    expect(totals.meanSecondsPlayed).toBe(0);
    expect(totals.completionRate).toBe(0);
  });
});

describe("getCreatorDashboardView", () => {
  it("merges per-video metrics onto each row and puts drafts first", async () => {
    const live = await createVideo(db, {
      title: "Live",
      genre: ["Drama"],
      status: "published",
      posterUrl: "/p.webp",
      runtimeSeconds: 100,
    });
    await createVideo(db, { title: "WIP", genre: ["Comedy"] }); // draft
    await watch(live.id, "s1", 100);
    await watch(live.id, "s2", 40);

    const { totals, videos } = await getCreatorDashboardView(db);

    // draft sorts ahead of published
    expect(videos.map((v) => v.status)).toEqual(["draft", "published"]);

    const liveRow = videos.find((v) => v.videoId === live.id)!;
    expect(liveRow.views).toBe(2); // metrics actually attached
    expect(liveRow.meanPctWatched).toBeCloseTo(0.7, 5);
    expect(liveRow.posterUrl).toBe("/p.webp"); // presentation fields present
    expect(liveRow.runtimeSeconds).toBe(100);

    expect(totals.views).toBe(2);
  });
});
