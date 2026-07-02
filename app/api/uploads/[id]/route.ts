import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { deleteVideo } from "@/lib/services/videos";
import { isUuid } from "@/lib/utils";

// Deletes a video (an "upload") and everything that hangs off it. The `clips`
// and `watch_events` rows are removed automatically by the DB's ON DELETE
// CASCADE, so this only has to drop the `videos` row.
//
// Note: the file bytes in Supabase Storage (`{id}/source.*`, `{id}/poster.jpg`)
// are NOT removed here. All storage access in this app is client-side with the
// publishable key; there is no server-side service-role credential to authorize
// a delete, so the bytes are intentionally orphaned rather than deleted through
// a public key. Reclaiming them belongs to a storage lifecycle job.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Malformed id → nothing could match it. Treat as not found.
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const deleted = await deleteVideo(db, id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
