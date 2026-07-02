import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit upload",
};

/**
 * Per-video editor. Keyed on the draft's id so AI tagging can process async
 * while the creator fills metadata, and so they can return here to
 * approve/edit even after publishing. Later: an `UploadEditor` client island
 * (metadata form, suggested tags, preview, publish/re-edit).
 *
 * Next 15: `params` is a Promise and must be awaited.
 */
export default async function UploadEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="flex min-h-screen flex-col px-5 pt-[var(--margin-main-top)]">
      <h1 className="text-medium text-foreground">Edit upload {id}</h1>
      <p className="mt-2 text-small text-muted">
        Metadata, AI tag suggestions, preview, and publish will live here.
      </p>
    </main>
  );
}
