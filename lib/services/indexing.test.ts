import type { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeTestDb } from "@/lib/db/test-utils";
import type { Database } from "@/lib/db/types";
import { createVideo, getVideo, updateVideo } from "./videos";
import { listClipsByVideo, setClipFeatured } from "./clips";
import {
  ensureIndexing,
  getEnrichmentState,
  reconcileIndexing,
} from "./indexing";

// The TL client is fully mocked — these tests exercise the reconciler's DB logic
// (claim, dedup, status transitions, crash recovery), not the network.
vi.mock("@/lib/services/twelve-labs", () => ({
  createIndexingTask: vi.fn(),
  getTask: vi.fn(),
  analyzeTags: vi.fn(),
  analyzeClips: vi.fn(),
  TL_READY: "ready",
  TL_FAILED: "failed",
}));
import * as tl from "@/lib/services/twelve-labs";

let db: Database;
let client: PGlite;

beforeEach(async () => {
  ({ db, client } = await makeTestDb());
  vi.clearAllMocks();
  vi.mocked(tl.createIndexingTask).mockResolvedValue({
    taskId: "task_1",
    videoId: "tlvid_1",
  });
  vi.mocked(tl.getTask).mockResolvedValue({
    status: "ready",
    videoId: "tlvid_1",
  });
  vi.mocked(tl.analyzeTags).mockResolvedValue({
    synopsis: "A quiet reunion.",
    moodTags: ["Wistful"],
    tags: ["Short film"],
  });
  vi.mocked(tl.analyzeClips).mockResolvedValue([
    { id: "8-24", startS: 8, endS: 24, label: "Rain" },
    { id: "74-91", startS: 74, endS: 91, label: "Recognition" },
  ]);
});
afterEach(async () => {
  await client.close();
});

const uploaded = () =>
  createVideo(db, { title: "T", storagePath: "https://x/v.mp4" });

describe("ensureIndexing", () => {
  it("claims a pending video and kicks off indexing exactly once", async () => {
    const v = await uploaded();
    await ensureIndexing(db, v.id);

    expect(tl.createIndexingTask).toHaveBeenCalledTimes(1);
    expect(tl.createIndexingTask).toHaveBeenCalledWith({
      videoUrl: "https://x/v.mp4",
      externalId: v.id,
    });
    const row = await getVideo(db, v.id);
    expect(row?.aiTagsStatus).toBe("processing");
    expect(row?.aiClipsStatus).toBe("processing");
    expect(row?.tlTaskId).toBe("task_1");
    expect(row?.tlVideoId).toBe("tlvid_1");
  });

  it("is idempotent — a second call no-ops (de-dup)", async () => {
    const v = await uploaded();
    await ensureIndexing(db, v.id);
    await ensureIndexing(db, v.id);
    expect(tl.createIndexingTask).toHaveBeenCalledTimes(1);
  });

  it("de-dups under concurrent triggers — only one task created", async () => {
    const v = await uploaded();
    await Promise.all([
      ensureIndexing(db, v.id),
      ensureIndexing(db, v.id),
      ensureIndexing(db, v.id),
    ]);
    expect(tl.createIndexingTask).toHaveBeenCalledTimes(1);
  });

  it("no-ops when the video has no uploaded bytes yet", async () => {
    const v = await createVideo(db, { title: "no bytes" });
    await ensureIndexing(db, v.id);
    expect(tl.createIndexingTask).not.toHaveBeenCalled();
    expect((await getVideo(db, v.id))?.aiTagsStatus).toBe("pending");
  });

  it("rolls the claim back to pending when the TL call fails", async () => {
    vi.mocked(tl.createIndexingTask).mockRejectedValueOnce(new Error("boom"));
    const v = await uploaded();
    await ensureIndexing(db, v.id);
    const row = await getVideo(db, v.id);
    expect(row?.aiTagsStatus).toBe("pending");
    expect(row?.aiClipsStatus).toBe("pending");
    expect(row?.tlTaskId).toBeNull();
  });
});

describe("reconcileIndexing", () => {
  const processing = async () => {
    const v = await uploaded();
    await updateVideo(db, v.id, {
      aiTagsStatus: "processing",
      aiClipsStatus: "processing",
      tlTaskId: "task_1",
      tlVideoId: "tlvid_1",
    });
    return v;
  };

  it("leaves a still-indexing video processing and runs no analysis", async () => {
    vi.mocked(tl.getTask).mockResolvedValue({
      status: "indexing",
      videoId: "tlvid_1",
    });
    const v = await processing();
    await reconcileIndexing(db, v.id);
    expect(tl.analyzeTags).not.toHaveBeenCalled();
    const row = await getVideo(db, v.id);
    expect(row?.aiTagsStatus).toBe("processing");
  });

  it("populates suggestions + clips and marks both ready when indexed", async () => {
    const v = await processing();
    await reconcileIndexing(db, v.id);

    const row = await getVideo(db, v.id);
    expect(row?.aiTagsStatus).toBe("ready");
    expect(row?.aiClipsStatus).toBe("ready");
    expect(row?.aiSuggestions).toMatchObject({ moodTags: ["Wistful"] });
    const clips = await listClipsByVideo(db, v.id);
    expect(clips).toHaveLength(2);
    expect(clips[0]).toMatchObject({ startS: 8, endS: 24, label: "Rain" });
  });

  it("marks both failed when the task failed", async () => {
    vi.mocked(tl.getTask).mockResolvedValue({
      status: "failed",
      videoId: "tlvid_1",
    });
    const v = await processing();
    await reconcileIndexing(db, v.id);
    const row = await getVideo(db, v.id);
    expect(row?.aiTagsStatus).toBe("failed");
    expect(row?.aiClipsStatus).toBe("failed");
    expect(tl.analyzeTags).not.toHaveBeenCalled();
  });

  it("fails only the surface whose analysis errored", async () => {
    vi.mocked(tl.analyzeTags).mockRejectedValueOnce(new Error("nope"));
    const v = await processing();
    await reconcileIndexing(db, v.id);
    const row = await getVideo(db, v.id);
    expect(row?.aiTagsStatus).toBe("failed");
    expect(row?.aiClipsStatus).toBe("ready");
    expect(await listClipsByVideo(db, v.id)).toHaveLength(2);
  });

  it("recovers a STALE crashed kickoff (processing, no task id) to pending", async () => {
    const v = await uploaded();
    await updateVideo(db, v.id, {
      aiTagsStatus: "processing",
      aiClipsStatus: "processing",
      indexingStartedAt: new Date(Date.now() - 5 * 60_000), // 5 min ago
    });
    await reconcileIndexing(db, v.id);
    expect(tl.getTask).not.toHaveBeenCalled();
    const row = await getVideo(db, v.id);
    expect(row?.aiTagsStatus).toBe("pending");
  });

  it("does NOT reset a fresh in-flight kickoff (claim→persist race)", async () => {
    const v = await uploaded();
    await updateVideo(db, v.id, {
      aiTagsStatus: "processing",
      aiClipsStatus: "processing",
      indexingStartedAt: new Date(), // just claimed, task id not persisted yet
    });
    await reconcileIndexing(db, v.id);
    expect(tl.getTask).not.toHaveBeenCalled();
    // Still processing — the concurrent kickoff is allowed to finish.
    expect((await getVideo(db, v.id))?.aiTagsStatus).toBe("processing");
  });

  it("does not duplicate clips when reconciled twice (idempotent replace)", async () => {
    const v = await processing();
    await reconcileIndexing(db, v.id);
    // Force a re-run by reopening the clips surface.
    await updateVideo(db, v.id, { aiClipsStatus: "processing" });
    await reconcileIndexing(db, v.id);
    expect(await listClipsByVideo(db, v.id)).toHaveLength(2);
  });

  it("no-ops once both surfaces are terminal", async () => {
    const v = await processing();
    await updateVideo(db, v.id, {
      aiTagsStatus: "ready",
      aiClipsStatus: "ready",
    });
    await reconcileIndexing(db, v.id);
    expect(tl.getTask).not.toHaveBeenCalled();
  });
});

describe("getEnrichmentState", () => {
  it("returns statuses, persisted suggestions, and mapped clips", async () => {
    const v = await uploaded();
    await updateVideo(db, v.id, {
      aiTagsStatus: "processing",
      aiClipsStatus: "processing",
      tlTaskId: "task_1",
      tlVideoId: "tlvid_1",
    });
    await reconcileIndexing(db, v.id);

    const state = await getEnrichmentState(db, v.id);
    expect(state?.aiTagsStatus).toBe("ready");
    expect(state?.suggestions).toMatchObject({ moodTags: ["Wistful"] });
    expect(state?.clips.map((c) => c.label)).toEqual(["Rain", "Recognition"]);
    expect(state?.clips[0].id).toMatch(/^[0-9a-f-]{36}$/); // db uuid, not synthetic
    // Reconciled clips default to featured.
    expect(state?.featuredClipIds).toEqual(state?.clips.map((c) => c.id));
  });

  it("reflects unfeatured clips in featuredClipIds", async () => {
    const v = await uploaded();
    await updateVideo(db, v.id, {
      aiTagsStatus: "processing",
      aiClipsStatus: "processing",
      tlTaskId: "task_1",
      tlVideoId: "tlvid_1",
    });
    await reconcileIndexing(db, v.id);

    const before = await getEnrichmentState(db, v.id);
    const dropped = before!.clips[0].id;
    await setClipFeatured(db, dropped, false);

    const after = await getEnrichmentState(db, v.id);
    expect(after?.clips).toHaveLength(2); // still shown in the editor
    expect(after?.featuredClipIds).not.toContain(dropped);
    expect(after?.featuredClipIds).toHaveLength(1);
  });

  it("returns null for a missing video", async () => {
    expect(
      await getEnrichmentState(db, "00000000-0000-0000-0000-000000000000"),
    ).toBeNull();
  });
});
