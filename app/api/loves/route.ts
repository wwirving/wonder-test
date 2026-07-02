import { NextResponse } from "next/server";

/**
 * Set or clear a viewer's "love" for a video and return the fresh total. Keyed
 * by the anonymous per-browser session id (localStorage `wtv_session`), same as
 * watch analytics — no accounts. Best-effort: a failed persist must never break
 * the (optimistic) button, so error paths still return the count the client
 * sent us back to, letting its local state stand.
 *
 * When no database is configured (mock mode) the route echoes the optimistic
 * count without importing the throwing DB client.
 */

type LoveInput = { videoId: string; sessionId: string; loved: boolean };

function parse(raw: unknown): LoveInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.videoId !== "string" || !b.videoId) return null;
  if (typeof b.sessionId !== "string" || !b.sessionId) return null;
  if (typeof b.loved !== "boolean") return null;
  return { videoId: b.videoId, sessionId: b.sessionId, loved: b.loved };
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = parse(raw);
  if (!input) {
    return NextResponse.json({ error: "Invalid love" }, { status: 400 });
  }

  // No DB wired up (mock feed) → accept and echo. The client's optimistic count
  // stands. Import lazily so the throwing DB client is never evaluated here.
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ loved: input.loved, loves: null });
  }

  try {
    const { db } = await import("@/lib/db/client");
    const { setLove } = await import("@/lib/services/loves");
    const loves = await setLove(
      db,
      input.videoId,
      input.sessionId,
      input.loved,
    );
    return NextResponse.json({ loved: input.loved, loves });
  } catch {
    // Unknown video id, connection blip, etc. Report the intended state with no
    // authoritative count; the client keeps its optimistic number.
    return NextResponse.json({ loved: input.loved, loves: null });
  }
}
