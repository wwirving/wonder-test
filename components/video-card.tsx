"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { type Video } from "@/lib/db/schema";
import { formatRuntime, formatYear } from "@/lib/format";
import type { ViewMode } from "@/components/view-selector";
import { Tag } from "@/components/tag";
import { Avatar } from "@/components/avatar";

/**
 * The 16:9 poster frame: static poster at rest, muted preview on hover
 * (Vimeo-style — lighter than autoplaying every card), with an always-visible
 * runtime badge. The whole frame links to the watch page.
 */
function VideoMedia({ video }: { video: Video }) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const runtime = formatRuntime(video.runtimeSeconds);

  function enter() {
    const el = ref.current;
    if (!el) return;
    setPlaying(true);
    el.play().catch(() => setPlaying(false));
  }
  function leave() {
    const el = ref.current;
    setPlaying(false);
    if (el) el.pause();
  }

  return (
    <Link
      href={`/watch/${video.id}`}
      onMouseEnter={enter}
      onMouseLeave={leave}
      className="group relative block overflow-hidden rounded-card shadow-project"
      aria-label={video.title}
    >
      <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={video.posterUrl ?? undefined}
          alt=""
        />
        {video.storagePath && (
          <video
            ref={ref}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
              playing ? "opacity-100" : "opacity-0",
            )}
            src={video.storagePath}
            muted
            loop
            playsInline
            preload="none"
          />
        )}
      </div>

      {runtime && (
        <span
          className="pointer-events-none absolute right-2 bottom-2 rounded-control px-[0.5em] py-[0.35em] text-xsmall leading-none text-background tabular-nums"
          style={{ backgroundColor: "var(--overlay)" }}
        >
          {runtime}
        </span>
      )}
    </Link>
  );
}

/** One column of the list-view metadata table (mirrors the old data-table cell). */
function Cell({
  className,
  children,
  empty,
}: {
  className?: string;
  children?: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className={cn("block", empty && "line-through opacity-25", className)}>
      {empty ? "—" : children}
    </div>
  );
}

/** Year / Director / Genre / Runtime table shown in list view. */
function VideoDataTable({ video }: { video: Video }) {
  const widths = {
    year: "w-[16.6667%]",
    director: "w-[33.3333%] pr-4",
    genre: "w-[30%] pr-5",
    runtime: "w-[20%]",
  };
  const year = formatYear(video.createdAt);
  const runtime = formatRuntime(video.runtimeSeconds);

  return (
    <div className="block w-full text-small">
      {/* header row */}
      <div className="mb-1 flex items-start justify-between text-muted">
        <Cell className={widths.year}>
          <h3>Year</h3>
        </Cell>
        <Cell className={widths.director}>
          <h3>Director</h3>
        </Cell>
        <Cell className={widths.genre}>
          <h3>Genre</h3>
        </Cell>
        <Cell className={widths.runtime}>
          <h3>Runtime</h3>
        </Cell>
      </div>

      {/* value row */}
      <div className="flex items-start justify-between">
        <Cell className={widths.year} empty={!year}>
          {year}
        </Cell>
        <Cell className={widths.director} empty={!video.director}>
          <span className="flex items-center gap-2">
            <Avatar name={video.director} className="size-5" />
            <span className="truncate">{video.director}</span>
          </span>
        </Cell>
        <Cell className={widths.genre} empty={!video.genre.length}>
          {video.genre.join(", ")}
        </Cell>
        <Cell className={widths.runtime} empty={!runtime}>
          <span className="tabular-nums">{runtime}</span>
        </Cell>
      </div>
    </div>
  );
}

export function VideoCard({ video, view }: { video: Video; view: ViewMode }) {
  const isGrid = view === "grid";
  const year = formatYear(video.createdAt);

  /* ---------- grid: minimal, poster-forward ---------- */
  if (isGrid) {
    return (
      <article className="block w-full">
        <div className="mb-3">
          <VideoMedia video={video} />
        </div>
        <h2 className="mb-1.5 text-small text-foreground">
          <Link
            href={`/watch/${video.id}`}
            className="transition-opacity hover:opacity-65"
          >
            {video.title}
          </Link>
        </h2>
        <div className="flex items-center gap-2 text-small text-muted">
          <Avatar name={video.director} className="size-5" />
          <span className="truncate text-subtle">
            {video.director ?? "Unknown"}
          </span>
          {year && (
            <>
              <span aria-hidden>·</span>
              <span>{year}</span>
            </>
          )}
        </div>
      </article>
    );
  }

  /* ---------- list: full-width editorial card ---------- */
  return (
    <article className="mx-auto block w-full max-w-[60rem]">
      <div className="mb-[var(--margin-sm2)]">
        <VideoMedia video={video} />
      </div>

      <div className="mx-auto block max-w-[53rem]">
        <h2 className="mb-1.5 block text-small text-muted">
          <Link
            href={`/watch/${video.id}`}
            className="transition-opacity hover:opacity-65"
          >
            {video.title}
          </Link>
        </h2>

        {video.synopsis && (
          <p className="mb-[var(--margin-sm)] block text-medium">
            {video.synopsis}
          </p>
        )}

        <VideoDataTable video={video} />

        {video.moodTags.length > 0 && (
          <aside className="mt-[var(--margin-sm)] flex flex-wrap gap-1 text-small">
            {video.moodTags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </aside>
        )}
      </div>
    </article>
  );
}
