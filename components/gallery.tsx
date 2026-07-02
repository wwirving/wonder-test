"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { DiscoverVideo } from "@/lib/mock-videos";
import { SearchFilter } from "@/components/search-filter";
import { ViewSelector, type ViewMode } from "@/components/view-selector";
import { VideoCard } from "@/components/video-card";

/**
 * Client container for the discover feed: search/tag filter, the list/grid
 * toggle, and the video collection. Grid is the default (poster-forward);
 * list is the richer, metadata-heavy alternate.
 */
export function Gallery({ videos }: { videos: DiscoverVideo[] }) {
  const [view, setView] = React.useState<ViewMode>("grid");
  const [activeTags, setActiveTags] = React.useState<string[]>([]);

  // Add/remove a single tag from the active filter. Shared by the filter bar
  // chips and the clickable tags on each card.
  const toggleTag = React.useCallback((tag: string) => {
    setActiveTags((cur) =>
      cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag],
    );
  }, []);

  // Only offer filters that actually appear in the feed (genre + mood).
  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    for (const v of videos) {
      for (const g of v.genre) set.add(g);
      for (const m of v.moodTags) set.add(m);
    }
    return [...set].sort();
  }, [videos]);

  const filtered = React.useMemo(() => {
    if (activeTags.length === 0) return videos;
    return videos.filter((v) => {
      // Match against the same vocabulary the filter offers (genre + mood).
      // `tags` is freeform, shown only on the watch page, and never selectable
      // here, so it's deliberately excluded to keep the two in sync.
      const own = new Set([...v.genre, ...v.moodTags]);
      return activeTags.every((t) => own.has(t));
    });
  }, [videos, activeTags]);

  return (
    <>
      <SearchFilter allTags={allTags} active={activeTags} onChange={setActiveTags} />

      <div className="mb-8">
        <ViewSelector view={view} onChange={setView} />
      </div>

      <div
        className={cn(
          "mx-auto flex w-full px-5 pb-16",
          view === "grid"
            ? "max-w-none flex-row flex-wrap items-start gap-5 gap-y-14"
            : "max-w-[1920px] flex-col items-center gap-y-[var(--margin-xl)]",
        )}
      >
        {filtered.map((v) => (
          <div
            key={v.id}
            className={cn(
              // Simple opacity fade-up on mount (house `animate-enter`). Cards are
              // keyed by id, so it fires once per card, not on filter/view toggle.
              "animate-enter",
              // List items must fill a consistent width — without this, the flex
              // column (items-center, no stretch) collapses each card to its
              // poster's intrinsic width, so cards vary in size by image. The
              // card's own max-w-[60rem] mx-auto then centers it.
              view === "grid"
                ? "w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.833rem)]"
                : "w-full",
            )}
          >
            <VideoCard
              video={v}
              view={view}
              activeTags={activeTags}
              onToggleTag={toggleTag}
            />
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="w-full py-20 text-center text-small text-muted">
            No videos match those filters.
          </p>
        )}
      </div>
    </>
  );
}
