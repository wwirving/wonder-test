import type { Video, VideoStatus } from "./db";

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

/** Catalogue-wide roll-up shown at the top of the creator dashboard. */
export type DashboardTotals = {
  videos: number; // all titles (published + draft)
  drafts: number; // subset still unpublished
  views: number;
  meanPctWatched: number; // 0..1 — views-weighted across the catalogue
  meanSecondsPlayed: number; // views-weighted mean watch time
  completionRate: number; // 0..1
};

/** The full creator dashboard: per-video rows plus catalogue totals. */
export type CreatorDashboard = {
  perVideo: DashboardRow[];
  totals: DashboardTotals;
};

/**
 * A dashboard row enriched with the presentation + enrichment fields the UI
 * needs (poster, runtime, AI status). The live page merges `DashboardRow`
 * metrics with the matching `Video` row by id; the mock returns this shape
 * directly.
 */
export type DashboardVideo = DashboardRow & {
  posterUrl: string | null;
  runtimeSeconds: number | null;
  aiTagsStatus: Video["aiTagsStatus"];
  aiClipsStatus: Video["aiClipsStatus"];
};

/** The view-model the `/dashboard` page renders: totals + enriched rows. */
export type CreatorDashboardView = {
  totals: DashboardTotals;
  videos: DashboardVideo[];
};
