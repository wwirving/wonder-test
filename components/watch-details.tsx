"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Video } from "@/lib/db/schema";
import { formatRuntime, formatYear } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import { Tag } from "@/components/tag";
import { Button } from "@/components/ui/button";

/**
 * The metadata beneath the player. Video-first: title, creator, year and
 * runtime plus a short synopsis are always visible; genre / mood / tags (and
 * the full synopsis) reveal on demand behind a single "More info" toggle, so
 * the page never competes with the film for attention.
 */
export function WatchDetails({ video }: { video: Video }) {
  const [expanded, setExpanded] = React.useState(false);
  const year = formatYear(video.createdAt);
  const runtime = formatRuntime(video.runtimeSeconds);
  const hasExtra =
    video.genre.length > 0 || video.moodTags.length > 0 || video.tags.length > 0;

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-balance text-medium text-foreground">{video.title}</h1>
        {video.accessTier === "members" && (
          <span className="frosted shrink-0 rounded-control px-2 py-1 text-xsmall text-subtle">
            Members
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-small text-muted">
        <Avatar name={video.director} className="size-6" />
        <span className="text-subtle">{video.director ?? "Unknown"}</span>
        {year && (
          <>
            <span aria-hidden>·</span>
            <span>{year}</span>
          </>
        )}
        {runtime && (
          <>
            <span aria-hidden>·</span>
            <span className="tabular-nums">{runtime}</span>
          </>
        )}
      </div>

      {video.synopsis && (
        <p
          className={cn(
            "mt-[var(--margin-sm)] max-w-[46rem] text-small text-pretty text-subtle",
            !expanded && "line-clamp-2",
          )}
        >
          {video.synopsis}
        </p>
      )}

      {(hasExtra || video.synopsis) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 -ml-3 gap-1"
        >
          {expanded ? "Less" : "More info"}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </Button>
      )}

      {expanded && (
        <div className="animate-enter mt-[var(--margin-sm)] flex flex-col gap-[var(--margin-sm)]">
          <MetaRow label="Genre" values={video.genre} />
          <MetaRow label="Mood" values={video.moodTags} />
          <MetaRow label="Tags" values={video.tags} />
        </div>
      )}
    </section>
  );
}

function MetaRow({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6">
      <h2 className="w-20 shrink-0 text-small text-muted">{label}</h2>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <Tag key={v}>{v}</Tag>
        ))}
      </div>
    </div>
  );
}
