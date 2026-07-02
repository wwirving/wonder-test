import type { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb } from "@/lib/db/test-utils";
import type { Database } from "@/lib/db/types";
import { createClip, deleteClip, listClipsByVideo } from "./clips";
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
});
