import type { VideoStatus } from "./db";

/** Filters for `listVideos` (e.g. the public gallery vs the creator's drafts). */
export type ListVideosFilter = {
  status?: VideoStatus;
  limit?: number;
};

/** `POST /api/uploads` request: what the creator picked. */
export type UploadRequest = {
  filename: string;
  contentType: string;
  runtimeSeconds: number | null;
};

/** `POST /api/uploads` response: draft id + where to send the bytes. */
export type UploadResponse = {
  videoId: string;
  path: string;
};
