import type { VideoStatus } from "./db";

/** Engagement metrics for a single video. */
export type VideoAnalytics = {
  videoId: string;
  views: number;
  meanPctWatched: number; // 0..1
  meanSecondsPlayed: number;
  completionRate: number; // 0..1 — share of views past the completion threshold
};

/** One row of the creator dashboard: a video plus its engagement roll-up. */
export type DashboardRow = {
  videoId: string;
  title: string;
  status: VideoStatus;
  views: number;
  meanPctWatched: number;
  meanSecondsPlayed: number;
  completionRate: number;
};

/** The full creator dashboard: per-video rows plus catalogue totals. */
export type CreatorDashboard = {
  perVideo: DashboardRow[];
  totals: { videos: number; views: number };
};
