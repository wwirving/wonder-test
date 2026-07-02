import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watch",
};

/**
 * Public watch page. Later: server-fetch the published video by id and render
 * a client `VideoPlayer` island that reports throttled progress to
 * `watch_events`.
 *
 * Next 15: `params` is a Promise and must be awaited.
 */
export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="flex min-h-screen flex-col px-5 pt-[var(--margin-main-top)]">
      <h1 className="text-medium text-foreground">Watch {id}</h1>
      <p className="mt-2 text-small text-muted">
        The player and video details will live here.
      </p>
    </main>
  );
}
