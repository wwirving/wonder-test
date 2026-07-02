import { avg, count, eq, sql } from "drizzle-orm";
import { videos, watchEvents } from "@/lib/db/schema";
import type {
  CreatorDashboard,
  CreatorDashboardView,
  Database,
  DashboardRow,
  DashboardTotals,
  DashboardVideo,
  VideoAnalytics,
} from "@/lib/types";
import { listVideos } from "./videos";
import { getLoveCount, getLoveCountsByVideo } from "./loves";
import { countCommentsByVideo, countCommentsForVideo } from "./comments";

/** A watch counts as "completed" once ≥90% of the runtime has been played. */
export const COMPLETION_THRESHOLD = 0.9;

export async function getVideoAnalytics(
  db: Database,
  videoId: string,
): Promise<VideoAnalytics> {
  // A viewing session emits many throttled progress pings (one watch_events row
  // each). Roll those up to one row per session — furthest point reached — first,
  // so "views" counts sessions and completion is measured per session, not per ping.
  const sessions = db
    .select({
      maxPct: sql<number>`max(${watchEvents.pctWatched})`.as("max_pct"),
      maxSeconds: sql<number>`max(${watchEvents.watchedSeconds})`.as(
        "max_seconds",
      ),
    })
    .from(watchEvents)
    .where(eq(watchEvents.videoId, videoId))
    .groupBy(watchEvents.sessionId)
    .as("sessions");

  // Loves and comments live in their own tables (no join here — a join with
  // watch_events would fan the rows out and corrupt the retention averages).
  const [[row], loves, comments] = await Promise.all([
    db
      .select({
        views: count(),
        meanPctWatched: avg(sessions.maxPct).mapWith(Number),
        meanSecondsPlayed: avg(sessions.maxSeconds).mapWith(Number),
        completed: sql<number>`count(*) filter (where ${sessions.maxPct} >= ${COMPLETION_THRESHOLD})`.mapWith(
          Number,
        ),
      })
      .from(sessions),
    getLoveCount(db, videoId),
    countCommentsForVideo(db, videoId),
  ]);

  const views = Number(row?.views ?? 0);
  return {
    videoId,
    views,
    meanPctWatched: row?.meanPctWatched ?? 0,
    meanSecondsPlayed: row?.meanSecondsPlayed ?? 0,
    completionRate: views ? (row?.completed ?? 0) / views : 0,
    loves,
    comments,
  };
}

/**
 * One grouped query for the whole catalogue (N+1-free). Left join so videos with
 * zero watches still appear with zeroed metrics.
 */
export async function getCreatorDashboard(
  db: Database,
): Promise<CreatorDashboard> {
  // Collapse the per-ping watch_events to one row per (video, session) — the
  // furthest point that session reached — so the roll-up below counts sessions,
  // not throttled progress pings.
  const sessions = db
    .select({
      videoId: watchEvents.videoId,
      sessionId: watchEvents.sessionId,
      maxPct: sql<number>`max(${watchEvents.pctWatched})`.as("max_pct"),
      maxSeconds: sql<number>`max(${watchEvents.watchedSeconds})`.as(
        "max_seconds",
      ),
    })
    .from(watchEvents)
    .groupBy(watchEvents.videoId, watchEvents.sessionId)
    .as("sessions");

  const perVideoRaw = await db
    .select({
      videoId: videos.id,
      title: videos.title,
      status: videos.status,
      views: count(sessions.sessionId).mapWith(Number),
      meanPctWatched: avg(sessions.maxPct).mapWith(Number),
      meanSecondsPlayed: avg(sessions.maxSeconds).mapWith(Number),
      completed: sql<number>`count(*) filter (where ${sessions.maxPct} >= ${COMPLETION_THRESHOLD})`.mapWith(
        Number,
      ),
    })
    .from(videos)
    .leftJoin(sessions, eq(sessions.videoId, videos.id))
    .groupBy(videos.id)
    .orderBy(videos.createdAt);

  // Loves and comments per video, each in one grouped query (separate from the
  // watch roll-up to avoid a row-multiplying join), keyed by id for the merge.
  const [lovesByVideo, commentsByVideo] = await Promise.all([
    getLoveCountsByVideo(
      db,
      perVideoRaw.map((r) => r.videoId),
    ),
    countCommentsByVideo(db),
  ]);

  const perVideo: DashboardRow[] = perVideoRaw.map((r) => ({
    videoId: r.videoId,
    title: r.title,
    status: r.status,
    views: r.views,
    meanPctWatched: r.meanPctWatched ?? 0,
    meanSecondsPlayed: r.meanSecondsPlayed ?? 0,
    completionRate: r.views ? r.completed / r.views : 0,
    loves: lovesByVideo.get(r.videoId) ?? 0,
    comments: commentsByVideo.get(r.videoId) ?? 0,
  }));

  // Catalogue totals. Views-weighted retention/completion are exact global
  // means, not an average-of-averages: each video's views == its session count,
  // so Σ(meanPct·views) recovers the sum of per-session pct across every session
  // and Σ(completed) the total completed sessions. One pass, no extra query.
  const agg = perVideoRaw.reduce(
    (acc, r) => ({
      videos: acc.videos + 1,
      drafts: acc.drafts + (r.status === "draft" ? 1 : 0),
      views: acc.views + r.views,
      pctViews: acc.pctViews + (r.meanPctWatched ?? 0) * r.views,
      secViews: acc.secViews + (r.meanSecondsPlayed ?? 0) * r.views,
      completed: acc.completed + r.completed,
    }),
    { videos: 0, drafts: 0, views: 0, pctViews: 0, secViews: 0, completed: 0 },
  );

  let totalLoves = 0;
  for (const n of lovesByVideo.values()) totalLoves += n;
  let totalComments = 0;
  for (const n of commentsByVideo.values()) totalComments += n;

  const totals: DashboardTotals = {
    videos: agg.videos,
    drafts: agg.drafts,
    views: agg.views,
    meanPctWatched: agg.views ? agg.pctViews / agg.views : 0,
    meanSecondsPlayed: agg.views ? agg.secViews / agg.views : 0,
    completionRate: agg.views ? agg.completed / agg.views : 0,
    loves: totalLoves,
    comments: totalComments,
  };

  return { perVideo, totals };
}

/**
 * The dashboard view-model: engagement metrics merged with the presentation +
 * enrichment fields the UI needs (poster, runtime, AI status). Two N+1-free
 * queries — the grouped roll-up above and the video rows — joined by id in JS.
 * Ordered drafts-first (they need action), then newest published first.
 */
export async function getCreatorDashboardView(
  db: Database,
): Promise<CreatorDashboardView> {
  const [{ perVideo, totals }, rows] = await Promise.all([
    getCreatorDashboard(db),
    listVideos(db), // all statuses, desc(createdAt)
  ]);

  const metrics = new Map(perVideo.map((r) => [r.videoId, r]));

  const videos: DashboardVideo[] = rows.map((v) => {
    const m = metrics.get(v.id);
    return {
      videoId: v.id,
      title: v.title,
      status: v.status,
      views: m?.views ?? 0,
      meanPctWatched: m?.meanPctWatched ?? 0,
      meanSecondsPlayed: m?.meanSecondsPlayed ?? 0,
      completionRate: m?.completionRate ?? 0,
      loves: m?.loves ?? 0,
      comments: m?.comments ?? 0,
      posterUrl: v.posterUrl,
      runtimeSeconds: v.runtimeSeconds,
      aiTagsStatus: v.aiTagsStatus,
      aiClipsStatus: v.aiClipsStatus,
    };
  });

  // Drafts to the top; within a status, listVideos' createdAt-desc order holds
  // (Array.sort is stable).
  videos.sort((a, b) =>
    a.status === b.status ? 0 : a.status === "draft" ? -1 : 1,
  );

  return { totals, videos };
}
