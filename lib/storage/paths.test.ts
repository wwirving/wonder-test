import { describe, expect, it } from "vitest";
import { BUCKET, fileExt, fileStem, objectPath, publicUrl } from "./paths";

describe("fileExt", () => {
  it("lowercases the extension without the dot", () => {
    expect(fileExt("clip.MP4")).toBe("mp4");
    expect(fileExt("a.b.webm")).toBe("webm");
  });
  it("returns empty for no/edge extension", () => {
    expect(fileExt("noext")).toBe("");
    expect(fileExt(".hidden")).toBe(""); // leading dot only
    expect(fileExt("trailing.")).toBe("");
  });
});

describe("fileStem", () => {
  it("strips the extension and any path", () => {
    expect(fileStem("Until We Meet Again.mp4")).toBe("Until We Meet Again");
    expect(fileStem("/tmp/le-drip.mov")).toBe("le-drip");
    expect(fileStem("noext")).toBe("noext");
  });
});

describe("objectPath", () => {
  it("namespaces the source file under the video id", () => {
    expect(objectPath("abc-123", "mp4")).toBe("abc-123/source.mp4");
    expect(objectPath("abc-123", "")).toBe("abc-123/source");
  });
});

describe("publicUrl", () => {
  it("builds a public object URL, tolerating a trailing slash", () => {
    const path = objectPath("abc-123", "mp4");
    expect(publicUrl("https://xyz.supabase.co", path)).toBe(
      `https://xyz.supabase.co/storage/v1/object/public/${BUCKET}/abc-123/source.mp4`,
    );
    expect(publicUrl("https://xyz.supabase.co/", path)).toBe(
      `https://xyz.supabase.co/storage/v1/object/public/${BUCKET}/abc-123/source.mp4`,
    );
  });
});
