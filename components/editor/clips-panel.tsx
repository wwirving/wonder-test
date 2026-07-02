"use client";

import { AlertCircle, Check, Clapperboard, Download, Scissors } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { blurImageFor } from "@/lib/avatar";
import type { SuggestedClip } from "@/lib/mock-editor";
import type { AiStatus } from "@/components/editor/status";

/**
 * Twelve Labs auto-clips / highlights, revealed async. The creator selects which
 * moments to feature (later surfaced as in-player highlights) and can download
 * any clip to post on socials. Rendering the actual clip files is deferred, so
 * this picks segments and hands the export off to `onDownload`.
 * Handles every lifecycle state so a slow or failed index never blocks the page.
 */
export function ClipsPanel({
  status,
  clips,
  selected,
  onToggle,
  onDownload,
}: {
  status: AiStatus;
  clips: SuggestedClip[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onDownload: (clip: SuggestedClip) => void;
}) {
  if (status === "pending" || status === "processing") {
    return <ClipsSkeleton />;
  }

  if (status === "failed") {
    return (
      <EmptyState
        icon={<AlertCircle className="h-5 w-5" strokeWidth={1.5} />}
        title="Couldn't find moments"
        body="Automatic clip detection is unavailable for this video. You can still publish, then feature moments manually later."
      />
    );
  }

  if (clips.length === 0) {
    return (
      <EmptyState
        icon={<Clapperboard className="h-5 w-5" strokeWidth={1.5} />}
        title="No standout moments found"
        body="We didn't detect clear highlights in this cut. Publish as-is, or trim your own later."
      />
    );
  }

  const count = selected.size;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xsmall text-muted">
        {clips.length} moment{clips.length === 1 ? "" : "s"} found ·{" "}
        {count > 0 ? `${count} selected to feature` : "select the ones to feature"}
      </p>
      <ul className="flex flex-col gap-1.5">
        {clips.map((clip) => {
          const isOn = selected.has(clip.id);
          return (
            <li
              key={clip.id}
              className={cn(
                "flex items-center gap-2 rounded-card p-2 transition",
                isOn ? "bg-hover" : "hover:bg-hover",
              )}
            >
              {/* Main area toggles whether the clip is featured. */}
              <button
                type="button"
                onClick={() => onToggle(clip.id)}
                aria-pressed={isOn}
                aria-label={`${isOn ? "Unfeature" : "Feature"} ${clip.label}`}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="relative aspect-video h-14 shrink-0 overflow-hidden rounded-control outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={blurImageFor(clip.label)}
                    alt=""
                    className="absolute inset-0 h-full w-full scale-125 object-cover blur-[3px]"
                  />
                  <span className="absolute right-1 bottom-1 rounded-[2px] bg-overlay px-1 text-[10px] leading-tight text-background tabular-nums">
                    {formatDuration(clip.endS - clip.startS)}
                  </span>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small text-foreground">
                    {clip.label}
                  </span>
                  <span className="mt-0.5 block text-xsmall text-muted tabular-nums">
                    {formatDuration(clip.startS)} – {formatDuration(clip.endS)}
                  </span>
                </span>
              </button>

              {/* Download the clip for socials (export handled by parent). */}
              <button
                type="button"
                onClick={() => onDownload(clip)}
                aria-label={`Download ${clip.label}`}
                title="Download clip"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted transition hover:bg-input hover:text-foreground"
              >
                <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </button>

              <button
                type="button"
                onClick={() => onToggle(clip.id)}
                aria-pressed={isOn}
                aria-label={`${isOn ? "Unfeature" : "Feature"} ${clip.label}`}
                className="shrink-0"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border transition",
                    isOn
                      ? "border-foreground bg-foreground text-background"
                      : "border-[var(--input-strong)] text-transparent",
                  )}
                >
                  <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ClipsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-xsmall text-subtle">
        <Scissors className="h-3.5 w-3.5 animate-pulse" strokeWidth={1.5} aria-hidden />
        Finding standout moments in your video…
      </p>
      <ul className="flex flex-col gap-1.5">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-3 p-2">
            <span className="aspect-video h-14 shrink-0 animate-pulse rounded-control bg-input" />
            <span className="flex-1">
              <span className="block h-3 w-2/5 animate-pulse rounded-full bg-input" />
              <span className="mt-2 block h-2.5 w-1/4 animate-pulse rounded-full bg-input" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-[var(--input-strong)] px-6 py-10 text-center">
      <span className="text-muted">{icon}</span>
      <p className="text-small text-foreground">{title}</p>
      <p className="max-w-xs text-pretty text-xsmall text-muted">{body}</p>
    </div>
  );
}
