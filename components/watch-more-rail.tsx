import { getDiscoverVideos } from "@/lib/mock-videos";
import { VideoCard } from "@/components/video-card";

/**
 * "More on Wonder TV" — other published films below the one being watched, to
 * keep viewers moving through the catalogue (the brief's grow-audience goal).
 * Reuses the discover-feed card + grid verbatim so it stays visually in step
 * with the home page and every tile already links onward to /watch/[id].
 */
export async function WatchMoreRail({ excludeId }: { excludeId: string }) {
  const all = await getDiscoverVideos();
  const more = all.filter((v) => v.id !== excludeId).slice(0, 6);
  if (more.length === 0) return null;

  return (
    <section className="mt-[var(--margin-lg)]">
      <h2 className="mb-6 text-small text-muted">More on Wonder TV</h2>
      <div className="flex w-full flex-row flex-wrap items-start gap-5 gap-y-14">
        {more.map((v) => (
          <div
            key={v.id}
            className="w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.833rem)]"
          >
            <VideoCard video={v} view="grid" />
          </div>
        ))}
      </div>
    </section>
  );
}
