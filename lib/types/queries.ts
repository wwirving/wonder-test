import type { VideoStatus } from "./db";

/** Filters for `listVideos` (e.g. the public gallery vs the creator's drafts). */
export type ListVideosFilter = {
  status?: VideoStatus;
  limit?: number;
};
