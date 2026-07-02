import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVideoById } from "@/lib/mock-videos";
import { db } from "@/lib/db/client";
import { getLoveCount } from "@/lib/services/loves";
import { listCommentsForVideo } from "@/lib/services/comments";
import { WatchPlayer } from "@/components/watch-player";
import { WatchDetails } from "@/components/watch-details";
import { WatchComments } from "@/components/watch-comments";
import { WatchMoreRail } from "@/components/watch-more-rail";

type Params = { params: Promise<{ id: string }> };

// Read live: watchable set changes as creators publish.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideoById(id);
  if (!video) return { title: "Not found" };
  return { title: video.title, description: video.synopsis ?? undefined };
}

/**
 * Public watch page — the payoff of the publish loop. Server-fetches the
 * published video and renders a video-first layout: the player island up top,
 * progressively-disclosed details, then more of the catalogue.
 *
 * `WatchPlayer` wraps the player to post throttled progress into `watch_events`
 * (via /api/watch-events), feeding the retention analytics.
 */
export default async function WatchPage({ params }: Params) {
  const { id } = await params;
  const video = await getVideoById(id);

  // Only published films are watchable; anything else is a dead link.
  if (!video || video.status !== "published") notFound();

  // Aggregate love count for social proof + the button's starting number. The
  // per-viewer "loved" state is client-side (localStorage), so this SSR count
  // is viewer-agnostic and safe to render on the dynamic page. Comments are
  // server-fetched here and handed to the client island (which posts + refreshes).
  const [loveCount, comments] = await Promise.all([
    getLoveCount(db, id),
    listCommentsForVideo(db, id),
  ]);

  return (
    <main className="flex min-h-screen flex-col items-center px-5 pt-[var(--margin-main-top)] pb-[var(--margin-md)]">
      <div className="w-full max-w-[80rem]">
        <div className="animate-enter">
          <WatchPlayer video={video} />
        </div>

        <div className="mx-auto mt-[var(--margin-sm2)] max-w-[72rem]">
          <div className="animate-enter [animation-delay:80ms]">
            <WatchDetails video={video} loveCount={loveCount} />
          </div>
          <div className="animate-enter [animation-delay:160ms]">
            <WatchComments videoId={video.id} initial={comments} />
          </div>
          <div className="animate-enter [animation-delay:240ms]">
            <WatchMoreRail excludeId={id} />
          </div>
        </div>
      </div>
    </main>
  );
}
