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
