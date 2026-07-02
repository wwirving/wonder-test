import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { getVideo } from "@/lib/services/videos";
import { getVideoAnalytics } from "@/lib/services/analytics";
import { UploadEditor } from "@/components/upload-editor";

export const metadata: Metadata = {
  title: "Edit upload",
};

// Always read live: the draft is being actively edited and its analytics grow
// as people watch, so this page must never be statically cached.
export const dynamic = "force-dynamic";

/**
 * Per-video editor. Keyed on the draft's id so Twelve Labs indexing (kicked off
 * at upload) can enrich async while the creator fills metadata, and so they can
 * return here to approve/edit even after publishing.
 *
 * Next 15: `params` / `searchParams` are Promises and must be awaited.
 */
export default async function UploadEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  // Dashboard drills in with `?tab=analytics` to open a video's metrics directly.
  const { tab } = await searchParams;

  const video = await getVideo(db, id);
  if (!video) notFound();

  // Engagement roll-up over watch_events — only meaningful once published, but
  // cheap to fetch and lets the Analytics tab render real numbers on load.
  const analytics =
    video.status === "published" ? await getVideoAnalytics(db, id) : null;

  return <UploadEditor video={video} analytics={analytics} initialTab={tab} />;
}
