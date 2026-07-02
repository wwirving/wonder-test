import type { Metadata } from "next";
import { getDraftVideo } from "@/lib/mock-editor";
import { UploadEditor } from "@/components/upload-editor";

export const metadata: Metadata = {
  title: "Edit upload",
};

/**
 * Per-video editor. Keyed on the draft's id so Twelve Labs indexing (kicked off
 * at upload) can enrich async while the creator fills metadata, and so they can
 * return here to approve/edit even after publishing.
 *
 * MOCK: the draft is fabricated by `getDraftVideo`. Real build:
 *   const video = await getVideo(db, id);
 *   if (!video) notFound();
 * Everything downstream is already shaped as a `Video` row.
 *
 * Next 15: `params` is a Promise and must be awaited.
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
  const video = getDraftVideo(id);

  return <UploadEditor video={video} initialTab={tab} />;
}
