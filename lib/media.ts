// Browser-only helpers for reading media file metadata client-side.

/** Read a video's duration via a throwaway <video>; null if it can't be probed. */
export function probeDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    const finish = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.onloadedmetadata = () =>
      finish(
        Number.isFinite(video.duration) && video.duration > 0
          ? Math.round(video.duration)
          : null,
      );
    video.onerror = () => finish(null);
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
