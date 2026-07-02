import type { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb } from "@/lib/db/test-utils";
import type { Database } from "@/lib/db/types";
import {
  createVideo,
  deleteVideo,
  getVideo,
  listVideos,
  publishVideo,
  setAiStatus,
  updateVideo,
} from "./videos";
import type { NewVideo } from "@/lib/types";

let db: Database;
let client: PGlite;

beforeEach(async () => {
  ({ db, client } = await makeTestDb());
});
afterEach(async () => {
  await client.close();
});

const base: NewVideo = { title: "Test Film", genre: ["Drama"] };

describe("videos CRUD", () => {
  it("creates with sane defaults", async () => {
    const v = await createVideo(db, base);
    expect(v.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(v.status).toBe("draft");
    expect(v.accessTier).toBe("public");
    expect(v.aiTagsStatus).toBe("pending");
    expect(v.aiClipsStatus).toBe("pending");
    expect(v.genre).toEqual(["Drama"]);
    expect(v.moodTags).toEqual([]);
    expect(v.tags).toEqual([]);
    expect(v.createdAt).toBeInstanceOf(Date);
  });

  it("gets by id and returns null when missing", async () => {
    const v = await createVideo(db, base);
    expect(await getVideo(db, v.id)).toMatchObject({ id: v.id, title: "Test Film" });
    expect(
      await getVideo(db, "00000000-0000-0000-0000-000000000000"),
    ).toBeNull();
  });

  it("updates metadata via partial patch", async () => {
    const v = await createVideo(db, base);
    const updated = await updateVideo(db, v.id, {
      synopsis: "A quiet film.",
      moodTags: ["contemplative"],
    });
    expect(updated?.synopsis).toBe("A quiet film.");
    expect(updated?.moodTags).toEqual(["contemplative"]);
    expect(updated?.title).toBe("Test Film"); // untouched
  });

  it("lists filtered by status, newest first", async () => {
    const a = await createVideo(db, { ...base, title: "A" });
    await createVideo(db, { ...base, title: "B" });
    await publishVideo(db, a.id);

    const published = await listVideos(db, { status: "published" });
    expect(published).toHaveLength(1);
    expect(published[0].title).toBe("A");

    expect(await listVideos(db, { status: "draft" })).toHaveLength(1);
    expect(await listVideos(db)).toHaveLength(2);
  });

  it("publishes a draft", async () => {
    const v = await createVideo(db, base);
    const published = await publishVideo(db, v.id);
    expect(published?.status).toBe("published");
  });

  it("sets AI status (webhook path)", async () => {
    const v = await createVideo(db, base);
    await setAiStatus(db, v.id, "aiTagsStatus", "ready");
    expect((await getVideo(db, v.id))?.aiTagsStatus).toBe("ready");
  });

  it("deletes and reports whether a row was removed", async () => {
    const v = await createVideo(db, base);
    expect(await deleteVideo(db, v.id)).toBe(true);
    expect(await getVideo(db, v.id)).toBeNull();
    expect(await deleteVideo(db, v.id)).toBe(false);
  });

  it("rejects a negative runtime via the DB check constraint", async () => {
    await expect(
      createVideo(db, { ...base, runtimeSeconds: -5 }),
    ).rejects.toThrow();
  });
});
