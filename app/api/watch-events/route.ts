import { NextResponse } from "next/server";
import { finiteNonNegative } from "@/lib/utils";
import type { NewWatchEvent } from "@/lib/types";

/**
 * Records a throttled progress ping from the watch player into `watch_events`.
 * Best-effort by design: analytics must never degrade playback, so every
 * failure path still returns a quiet 204.
 *
 * `pct_watched` is a DB-generated column — we only send raw seconds. When no
 * database is configured (the app runs on mock data), the route no-ops rather
 * than importing the DB client, which throws without `DATABASE_URL`.
 */

/** The subset of a `watch_events` row a client is allowed to submit. */
type WatchEventInput = Pick<
  NewWatchEvent,
  "videoId" | "sessionId" | "watchedSeconds" | "videoDuration"
>;

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof raw !== "object" || raw === null) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = raw as Record<string, unknown>;
  const videoId = typeof body.videoId === "string" ? body.videoId : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const watchedSeconds = finiteNonNegative(body.watchedSeconds);
  const videoDuration = finiteNonNegative(body.videoDuration);

  // watchedSeconds may legitimately be 0 (just started); duration may not.
  if (!videoId || !sessionId || watchedSeconds === null || !videoDuration) {
    return NextResponse.json({ error: "Invalid watch event" }, { status: 400 });
  }

  const event: WatchEventInput = {
    videoId,
    sessionId,
    watchedSeconds,
    videoDuration,
  };

  // No DB wired up yet (mock feed) → accept and drop. Import lazily so the
  // throwing DB client is never evaluated in that case.
  if (!process.env.DATABASE_URL) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const { db } = await import("@/lib/db/client");
    const { recordWatchEvent } = await import("@/lib/services/watch-events");
    await recordWatchEvent(db, event);
  } catch {
    // Unknown video id (mock rows aren't in the DB), connection blip, etc.
    // Swallow — a lost progress ping is not worth a client-visible error.
  }

  return new NextResponse(null, { status: 204 });
}
