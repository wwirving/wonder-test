// Pure naming helpers for the Storage layout, shared by the upload route and
// the client uploader so both agree on where a video's bytes live.

/** The single Storage bucket holding creator video sources. Public-read. */
export const BUCKET = "videos";

// Upload ceiling. Must agree with the bucket's `file_size_limit` (migration
// 0001) and the project-wide global limit (Supabase dashboard → Storage).
export const MAX_UPLOAD_BYTES = 10 * 1024 ** 3; // 10 GB
export const MAX_UPLOAD_LABEL = "10 GB";

/** Accepted containers. Mirrored by the bucket's `allowed_mime_types`. */
export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

/** `"clip.MP4"` → `"mp4"`; empty if there's no extension. */
export function fileExt(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot <= 0 || dot === filename.length - 1) return "";
  return filename.slice(dot + 1).toLowerCase();
}

/** `"/tmp/Le Drip.mp4"` → `"Le Drip"`. */
export function fileStem(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(0, dot) : base;
}

/** Source path for a video, namespaced under its id so re-uploads overwrite. */
export function objectPath(videoId: string, ext: string): string {
  return ext ? `${videoId}/source.${ext}` : `${videoId}/source`;
}

/** Public URL for an object — deterministic, so it's known at row-create time. */
export function publicUrl(supabaseUrl: string, path: string): string {
  const origin = supabaseUrl.replace(/\/+$/, "");
  return `${origin}/storage/v1/object/public/${BUCKET}/${path}`;
}
