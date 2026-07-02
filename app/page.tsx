import { Gallery } from "@/components/gallery";
import { SiteFooter } from "@/components/site-footer";
import { Scroller } from "@/components/ui/scroller";
import { getDiscoverVideos } from "@/lib/mock-videos";

// Read live so newly-published films appear without a rebuild.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const videos = await getDiscoverVideos();

  // The Scroller owns the viewport scroll (hidden bar + soft edge fade), so the
  // native page scrollbar never shows. Header and filter are both fixed, so
  // this h-screen container is body's only in-flow child.
  return (
    <Scroller
      hideScrollbar
      className="page-home h-screen pt-[var(--margin-main-top)]"
    >
      <main className="flex min-h-full flex-col">
        <Gallery videos={videos} />
        <SiteFooter />
      </main>
    </Scroller>
  );
}
