import { avg, count, eq, sql } from "drizzle-orm";
import { videos, watchEvents } from "@/lib/db/schema";
import type {
  CreatorDashboard,
  Database,
  DashboardRow,
  VideoAnalytics,
} from "@/lib/types";

/** A watch counts as "completed" once ≥90% of the runtime has been played. */
export const COMPLETION_THRESHOLD = 0.9;

export async function getVideoAnalytics(
  db: Database,
  videoId: string,
): Promise<VideoAnalytics> {
  const [row] = await db
    .select({
      views: count(),
      meanPctWatched: avg(watchEvents.pctWatched).mapWith(Number),
      meanSecondsPlayed: avg(watchEvents.watchedSeconds).mapWith(Number),
      completed: sql<number>`count(*) filter (where ${watchEvents.pctWatched} >= ${COMPLETION_THRESHOLD})`.mapWith(
        Number,
      ),
    })
    .from(watchEvents)
    .where(eq(watchEvents.videoId, videoId));

  const views = Number(row?.views ?? 0);
  return {
    videoId,
    views,
    meanPctWatched: row?.meanPctWatched ?? 0,
    meanSecondsPlayed: row?.meanSecondsPlayed ?? 0,
    completionRate: views ? (row?.completed ?? 0) / views : 0,
  };
}

/**
 * One grouped query for the whole catalogue (N+1-free). Left join so videos with
 * zero watches still appear with zeroed metrics.
 */
export async function getCreatorDashboard(
  db: Database,
): Promise<CreatorDashboard> {
  const perVideoRaw = await db
    .select({
      videoId: videos.id,
      title: videos.title,
      status: videos.status,
      views: count(watchEvents.id).mapWith(Number),
      meanPctWatched: avg(watchEvents.pctWatched).mapWith(Number),
      meanSecondsPlayed: avg(watchEvents.watchedSeconds).mapWith(Number),
      completed: sql<number>`count(*) filter (where ${watchEvents.pctWatched} >= ${COMPLETION_THRESHOLD})`.mapWith(
        Number,
      ),
    })
    .from(videos)
    .leftJoin(watchEvents, eq(watchEvents.videoId, videos.id))
    .groupBy(videos.id)
    .orderBy(videos.createdAt);

  const perVideo: DashboardRow[] = perVideoRaw.map((r) => ({
    videoId: r.videoId,
    title: r.title,
    status: r.status,
    views: r.views,
    meanPctWatched: r.meanPctWatched ?? 0,
    meanSecondsPlayed: r.meanSecondsPlayed ?? 0,
    completionRate: r.views ? r.completed / r.views : 0,
  }));

  const totals = perVideo.reduce(
    (acc, r) => ({ videos: acc.videos + 1, views: acc.views + r.views }),
    { videos: 0, views: 0 },
  );

  return { perVideo, totals };
}
