import { NextResponse } from "next/server";
import type { NewComment } from "@/lib/types";

/**
 * Records a community comment on the watch page into `comments`. Identity is the
 * anonymous playback session id plus an optional display name — no accounts.
 *
 * Mirrors the watch-events ingest: when no database is configured (the app runs
 * on mock data), the route no-ops rather than importing the throwing DB client.
 */

const NAME_MAX = 60;
const BODY_MAX = 2000;

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
  const text = typeof body.body === "string" ? body.body.trim() : "";
  const nameRaw =
    typeof body.authorName === "string" ? body.authorName.trim() : "";
  const authorName = nameRaw ? nameRaw.slice(0, NAME_MAX) : null;

  if (!videoId || !sessionId || !text) {
    return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
  }

  const comment: NewComment = {
    videoId,
    sessionId,
    authorName,
    body: text.slice(0, BODY_MAX),
  };

  // No DB wired up yet (mock feed) → accept and drop. Import lazily so the
  // throwing DB client is never evaluated in that case.
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    const { db } = await import("@/lib/db/client");
    const { addComment } = await import("@/lib/services/comments");
    const row = await addComment(db, comment);
    return NextResponse.json(row, { status: 201 });
  } catch {
    // Unknown video id (mock rows aren't in the DB), connection blip, etc.
    return NextResponse.json({ error: "Could not save comment" }, {
      status: 500,
    });
  }
}
