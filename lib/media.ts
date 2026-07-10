// Browser-only helpers for reading media file metadata client-side.

export type VideoMetadata = {
  durationS: number | null;
  width: number | null;
  height: number | null;
};

const UNPROBED: VideoMetadata = { durationS: null, width: null, height: null };

/**
 * Read a video's duration and pixel dimensions via a throwaway <video> — one
 * probe, everything `loadedmetadata` exposes. Any field is null when the
 * browser can't determine it (dimensions come back 0×0 for audio-only files or
 * codecs it can't decode); callers must treat null as unknown, not invalid.
 */
export function probeVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    const finish = (value: VideoMetadata) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.onloadedmetadata = () =>
      finish({
        durationS:
          Number.isFinite(video.duration) && video.duration > 0
            ? Math.round(video.duration)
            : null,
        width: video.videoWidth || null,
        height: video.videoHeight || null,
      });
    video.onerror = () => finish(UNPROBED);
    video.src = url;
  });
}

/**
 * Grab a single poster frame from a local video File via a throwaway <video> +
 * <canvas>. Same-origin blob URL, so the canvas is never tainted (unlike drawing
 * a remote Storage URL). Seeks to `atFraction` of the runtime (default ~15% in,
 * past any black lead-in). Resolves null if the frame can't be captured — poster
 * generation is best-effort and must never block the upload.
 */
export function capturePoster(
  file: File,
  atFraction = 0.15,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    let settled = false;
    const finish = (value: Blob | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(value);
    };

    video.onloadedmetadata = () => {
      const d = video.duration;
      video.currentTime =
        Number.isFinite(d) && d > 0 ? Math.min(d * atFraction, d) : 0;
    };
    video.onseeked = () => {
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) return finish(null);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return finish(null);
        ctx.drawImage(video, 0, 0, w, h);
        canvas.toBlob((blob) => finish(blob), "image/jpeg", 0.82);
      } catch {
        finish(null);
      }
    };
    video.onerror = () => finish(null);
    // Give up rather than hang if decode/seek stalls.
    setTimeout(() => finish(null), 8000);
    video.src = url;
  });
}

/**
 * Grab a single frame at `timeS` from a remote video URL (e.g. a Storage
 * source) via a throwaway <video> + <canvas>. Requires the source to be
 * CORS-readable (`crossOrigin="anonymous"`) or the canvas taints and capture
 * fails — Supabase public objects send `Access-Control-Allow-Origin: *`, so this
 * works. Best-effort: resolves null on any error/timeout so callers can fall
 * back to the film poster. Used to give each clip its own still thumbnail.
 */
export function captureFrameFromUrl(
  url: string,
  timeS: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    let settled = false;
    const finish = (value: Blob | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    video.onloadedmetadata = () => {
      const d = video.duration;
      video.currentTime =
        Number.isFinite(d) && d > 0 ? Math.min(Math.max(timeS, 0), d - 0.05) : timeS;
    };
    video.onseeked = () => {
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) return finish(null);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return finish(null);
        ctx.drawImage(video, 0, 0, w, h);
        canvas.toBlob((blob) => finish(blob), "image/jpeg", 0.75);
      } catch {
        finish(null);
      }
    };
    video.onerror = () => finish(null);
    setTimeout(() => finish(null), 10000);
    video.src = url;
  });
}
