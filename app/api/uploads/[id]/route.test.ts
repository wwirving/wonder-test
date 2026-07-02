import { beforeEach, describe, expect, it, vi } from "vitest";

// The DB client throws at import time without DATABASE_URL, and the delete
// itself is already covered by lib/services/videos.test.ts. Stub both so this
// suite exercises only what the route owns: id validation and status mapping.
vi.mock("@/lib/db/client", () => ({ db: {} }));
const deleteVideo = vi.fn();
vi.mock("@/lib/services/videos", () => ({
  deleteVideo: (...args: unknown[]) => deleteVideo(...args),
}));

import { DELETE } from "./route";

const VALID_ID = "11111111-1111-1111-1111-111111111111";

function call(id: string) {
  return DELETE(new Request("http://test/api/uploads/" + id), {
    params: Promise.resolve({ id }),
  });
}

beforeEach(() => {
  deleteVideo.mockReset();
});

describe("DELETE /api/uploads/[id]", () => {
  it("204s and deletes when the row exists", async () => {
    deleteVideo.mockResolvedValue(true);
    const res = await call(VALID_ID);
    expect(res.status).toBe(204);
    expect(deleteVideo).toHaveBeenCalledWith({}, VALID_ID);
  });

  it("404s when the row does not exist", async () => {
    deleteVideo.mockResolvedValue(false);
    const res = await call(VALID_ID);
    expect(res.status).toBe(404);
  });

  it("404s a malformed id without hitting the DB", async () => {
    const res = await call("not-a-uuid");
    expect(res.status).toBe(404);
    expect(deleteVideo).not.toHaveBeenCalled();
  });
});
