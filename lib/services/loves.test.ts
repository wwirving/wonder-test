import type { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { makeTestDb } from "@/lib/db/test-utils";
import type { Database } from "@/lib/db/types";
import { loves } from "@/lib/db/schema";
import { createVideo, deleteVideo } from "./videos";
import {
  getLoveCount,
  getLoveCountsByVideo,
  hasLoved,
  setLove,
} from "./loves";

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

describe("setLove", () => {
  it("adds a love and returns the fresh count", async () => {
    expect(await setLove(db, videoId, "s1", true)).toBe(1);
    expect(await hasLoved(db, videoId, "s1")).toBe(true);
  });

  it("is idempotent per session — a double love counts once", async () => {
    await setLove(db, videoId, "s1", true);
    expect(await setLove(db, videoId, "s1", true)).toBe(1);
    expect(await getLoveCount(db, videoId)).toBe(1);
  });

  it("counts distinct sessions", async () => {
    await setLove(db, videoId, "s1", true);
    await setLove(db, videoId, "s2", true);
    expect(await getLoveCount(db, videoId)).toBe(2);
  });

  it("clears a love and can be re-added (toggle)", async () => {
    await setLove(db, videoId, "s1", true);
    expect(await setLove(db, videoId, "s1", false)).toBe(0);
    expect(await hasLoved(db, videoId, "s1")).toBe(false);
    expect(await setLove(db, videoId, "s1", true)).toBe(1);
  });

  it("unlove is a no-op when the session never loved", async () => {
    expect(await setLove(db, videoId, "ghost", false)).toBe(0);
  });

  it("cascades deletes when the parent video is removed", async () => {
    await setLove(db, videoId, "s1", true);
    await deleteVideo(db, videoId);
    const remaining = await db
      .select()
      .from(loves)
      .where(eq(loves.videoId, videoId));
    expect(remaining).toHaveLength(0);
  });
});

describe("getLoveCountsByVideo", () => {
  it("returns a per-video map and omits empty ids", async () => {
    const other = await createVideo(db, { title: "W", genre: ["Drama"] });
    await setLove(db, videoId, "s1", true);
    await setLove(db, videoId, "s2", true);

    const map = await getLoveCountsByVideo(db, [videoId, other.id]);
    expect(map.get(videoId)).toBe(2);
    expect(map.has(other.id)).toBe(false);
  });

  it("returns an empty map for no ids", async () => {
    expect((await getLoveCountsByVideo(db, [])).size).toBe(0);
  });
});
