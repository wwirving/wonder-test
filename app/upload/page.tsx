import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload",
};

/**
 * Upload entry point. Later: a client dropzone that creates a `videos` draft
 * (getting an id) and routes to /upload/[id] for metadata + publish.
 */
export default function UploadPage() {
  return (
    <main className="flex min-h-screen flex-col px-5 pt-[var(--margin-main-top)]">
      <h1 className="text-medium text-foreground">New upload</h1>
      <p className="mt-2 text-small text-muted">
        Drop a video to start a draft — you&apos;ll be taken to its editor to add
        metadata, preview, and publish.
      </p>
    </main>
  );
}
