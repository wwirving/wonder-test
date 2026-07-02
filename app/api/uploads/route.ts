import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { createVideo, updateVideo } from "@/lib/services/videos";
import { fileExt, fileStem, objectPath, publicUrl } from "@/lib/storage/paths";
import type { UploadResponse } from "@/lib/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Opens an upload: creates a draft `videos` row and returns where its bytes go.
// The client streams the file straight to Storage — we mint the destination and
// set storagePath to the (deterministic) public URL, but never proxy the video.
export async function POST(req: Request) {
  if (!SUPABASE_URL) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const filename = typeof body.filename === "string" ? body.filename.trim() : "";
  if (!filename) {
    return NextResponse.json({ error: "filename is required" }, { status: 400 });
  }

  const title = fileStem(filename).trim() || filename;
  const draft = await createVideo(db, {
    title,
    runtimeSeconds: normalizeRuntime(body.runtimeSeconds),
  });

  const path = objectPath(draft.id, fileExt(filename));
  await updateVideo(db, draft.id, { storagePath: publicUrl(SUPABASE_URL, path) });

  return NextResponse.json<UploadResponse>({ videoId: draft.id, path });
}

// Whole non-negative seconds, or null — matches the row's CHECK constraint.
function normalizeRuntime(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}
