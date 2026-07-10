// Twelve Labs' indexable resolution range, enforced client-side at file pick so
// creators hear "too small" before any bytes upload. The bounds come from TL's
// own rejection message: "between 360p(360x360) and 2160p(5184x2160)".
//
// The minimum (both edges >= 360) is exact — it's the rule we've seen TL enforce.
// The maximum is interpreted orientation-agnostically (long edge <= 5184, short
// edge <= 2160) so portrait footage isn't wrongly rejected; if TL is actually
// stricter for some shape, the server-side classifier still catches it and the
// editor shows the reason. Fail open here, never reject something TL would take.

export const MIN_EDGE = 360;
export const MAX_LONG_EDGE = 5184;
export const MAX_SHORT_EDGE = 2160;

export type DimensionCheck = { ok: true } | { ok: false; message: string };

/**
 * Validate a video's pixel dimensions against the indexable range. Unknown
 * dimensions (null/0 — audio-only files, codecs the browser can't decode) pass:
 * only the server, via Twelve Labs itself, can judge those.
 */
export function checkVideoDimensions(
  width: number | null,
  height: number | null,
): DimensionCheck {
  if (!width || !height) return { ok: true };

  if (width < MIN_EDGE || height < MIN_EDGE) {
    return {
      ok: false,
      message:
        `This video is ${width}×${height} — the minimum supported ` +
        `resolution is ${MIN_EDGE}×${MIN_EDGE}. Please export a larger version.`,
    };
  }

  const long = Math.max(width, height);
  const short = Math.min(width, height);
  if (long > MAX_LONG_EDGE || short > MAX_SHORT_EDGE) {
    return {
      ok: false,
      message:
        `This video is ${width}×${height} — the maximum supported ` +
        `resolution is 4K (${MAX_LONG_EDGE}×${MAX_SHORT_EDGE}). ` +
        `Please export a smaller version.`,
    };
  }

  return { ok: true };
}
