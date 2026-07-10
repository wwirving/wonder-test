import { describe, expect, it } from "vitest";
import { checkVideoDimensions } from "./limits";

describe("checkVideoDimensions", () => {
  it.each([
    [360, 360], // exact minimum
    [620, 360], // short edge on the line
    [1920, 1080], // typical HD
    [1080, 1920], // portrait HD — orientation-agnostic
    [5184, 2160], // exact maximum
    [2160, 5184], // maximum, portrait
  ])("accepts %i×%i", (w, h) => {
    expect(checkVideoDimensions(w, h)).toEqual({ ok: true });
  });

  it.each([
    [620, 349], // the real-world stuck upload
    [359, 360],
    [4000, 200],
  ])("rejects %i×%i as below the minimum", (w, h) => {
    const res = checkVideoDimensions(w, h);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toContain(`${w}×${h}`);
  });

  it.each([
    [6000, 2000], // long edge over 5184
    [5184, 2161], // short edge over 2160
    [3000, 3000], // square over the short-edge cap
  ])("rejects %i×%i as above the maximum", (w, h) => {
    const res = checkVideoDimensions(w, h);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toMatch(/maximum/i);
  });

  it("passes unknown dimensions through (server backstop decides)", () => {
    expect(checkVideoDimensions(null, null)).toEqual({ ok: true });
    expect(checkVideoDimensions(0, 0)).toEqual({ ok: true });
    expect(checkVideoDimensions(1920, null)).toEqual({ ok: true });
  });
});
