import type { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb } from "@/lib/db/test-utils";
import type { Database } from "@/lib/db/types";
import {
  createClip,
  deleteClip,
  listClipsByVideo,
  listFeaturedClipsForVideos,
  setClipFeatured,
  setClipPoster,
} from "./clips";
import { createVideo } from "./videos";

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

describe("clips CRUD", () => {
  it("creates a clip", async () => {
    const c = await createClip(db, {
      videoId,
      startS: 5,
      endS: 12,
      label: "opening",
    });
    expect(c.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(c.label).toBe("opening");
  });

  it("lists a video's clips ordered by start time", async () => {
    await createClip(db, { videoId, startS: 30, endS: 40 });
    await createClip(db, { videoId, startS: 5, endS: 10 });
    await createClip(db, { videoId, startS: 15, endS: 20 });

    const clips = await listClipsByVideo(db, videoId);
    expect(clips.map((c) => c.startS)).toEqual([5, 15, 30]);
  });

  it("deletes a clip and reports the result", async () => {
    const c = await createClip(db, { videoId, startS: 0, endS: 3 });
    expect(await deleteClip(db, c.id)).toBe(true);
    expect(await listClipsByVideo(db, videoId)).toHaveLength(0);
    expect(await deleteClip(db, c.id)).toBe(false);
  });

  it("rejects an inverted range via the DB check constraint", async () => {
    await expect(
      createClip(db, { videoId, startS: 20, endS: 10 }),
    ).rejects.toThrow();
  });

  it("defaults new clips to featured", async () => {
    const c = await createClip(db, { videoId, startS: 0, endS: 3 });
    expect(c.featured).toBe(true);
  });
});

describe("featuring clips", () => {
  it("toggles a clip's featured flag", async () => {
    const c = await createClip(db, { videoId, startS: 0, endS: 3 });
    await setClipFeatured(db, c.id, false);
    expect((await listClipsByVideo(db, videoId))[0].featured).toBe(false);
    await setClipFeatured(db, c.id, true);
    expect((await listClipsByVideo(db, videoId))[0].featured).toBe(true);
  });

  it("fetches only featured clips, grouped by video, batched", async () => {
    const other = await createVideo(db, { title: "V2" });
    // video 1: two featured (out of order) + one unfeatured
    await createClip(db, { videoId, startS: 30, endS: 40, label: "b" });
    const skip = await createClip(db, { videoId, startS: 5, endS: 10, label: "a" });
    await createClip(db, { videoId, startS: 50, endS: 55, label: "c" });
    await setClipFeatured(db, skip.id, false);
    // video 2: one featured
    await createClip(db, { videoId: other.id, startS: 1, endS: 4, label: "x" });

    const grouped = await listFeaturedClipsForVideos(db, [videoId, other.id]);
    expect(grouped.get(videoId)?.map((c) => c.label)).toEqual(["b", "c"]); // ordered, unfeatured dropped
    expect(grouped.get(other.id)?.map((c) => c.label)).toEqual(["x"]);
  });

  it("returns an empty map for no ids", async () => {
    const grouped = await listFeaturedClipsForVideos(db, []);
    expect(grouped.size).toBe(0);
  });

  it("persists a clip's generated poster and includes it when fetched", async () => {
    const c = await createClip(db, { videoId, startS: 0, endS: 3 });
    expect(c.posterUrl).toBeNull();
    await setClipPoster(db, c.id, "https://cdn/clip.jpg");
    const grouped = await listFeaturedClipsForVideos(db, [videoId]);
    expect(grouped.get(videoId)?.[0].posterUrl).toBe("https://cdn/clip.jpg");
  });
});
