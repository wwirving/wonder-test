"use client";

import * as React from "react";
import { AlertCircle, Check, Clapperboard, Download, Play, Scissors } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { useSegmentCycle, useVideoBuffering } from "@/lib/use-segment-cycle";
import type { SuggestedClip } from "@/lib/twelve-labs/types";
import { Spinner, type AiStatus } from "@/components/editor/status";

/**
 * Twelve Labs auto-clips / highlights, revealed async. Each clip previews the
 * real segment (played off the source video — no rendering), and the creator
 * features the moments they want, which the discover feed then cycles through.
 * Downloading a trimmed file is deferred (see "with more time"), so its button
 * is a disabled affordance. Handles every lifecycle state so a slow or failed
 * index never blocks the page.
 */
export function ClipsPanel({
  status,
  clips,
  videoSrc,
  posterUrl,
  selected,
  onToggle,
}: {
  status: AiStatus;
  clips: SuggestedClip[];
  /** Source video URL the segment previews play from. */
  videoSrc: string | null;
  /** Poster shown as the instant resting thumbnail (avoids a black frame). */
  posterUrl: string | null;
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  // One clip previews at a time — clicking a thumbnail plays that segment loop.
  const [playingId, setPlayingId] = React.useState<string | null>(null);
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
              {/* Real segment preview — click to play this clip's range on loop. */}
              <ClipPreview
                src={videoSrc}
                posterUrl={posterUrl}
                clip={clip}
                playing={playingId === clip.id}
                onToggle={() =>
                  setPlayingId((id) => (id === clip.id ? null : clip.id))
                }
              />

              {/* Label toggles whether the clip is featured. */}
              <button
                type="button"
                onClick={() => onToggle(clip.id)}
                aria-pressed={isOn}
                aria-label={`${isOn ? "Unfeature" : "Feature"} ${clip.label}`}
                className="flex min-w-0 flex-1 items-center text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small text-foreground">
                    {clip.label}
                  </span>
                  <span className="mt-0.5 block text-xsmall text-muted tabular-nums">
                    {formatDuration(clip.startS)} – {formatDuration(clip.endS)}
                  </span>
                </span>
              </button>

              {/* Clip export is deferred — see "with more time". */}
              <button
                type="button"
                disabled
                aria-label="Download clip (coming soon)"
                title="Clip export — coming soon"
                className="flex h-8 w-8 shrink-0 cursor-not-allowed items-center justify-center rounded-control text-muted/40"
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

/**
 * A single clip's preview thumbnail. At rest it shows the video's poster (an
 * image we already have — instant, no per-clip video load, no black frame).
 * Clicking mounts a `<video>` that plays the start→end segment on loop off the
 * source (no rendered file); the poster covers any buffering. Only the clicked
 * clip ever loads video bytes, so the list stays cheap no matter how many clips.
 */
function ClipPreview({
  src,
  posterUrl,
  clip,
  playing,
  onToggle,
}: {
  src: string | null;
  posterUrl: string | null;
  clip: SuggestedClip;
  playing: boolean;
  onToggle: () => void;
}) {
  const ref = React.useRef<HTMLVideoElement>(null);
  useSegmentCycle(ref, playing ? [clip] : [], playing);
  const buffering = useVideoBuffering(ref, playing);

  // The clip's own still frame if we've generated one, else the film poster.
  const still = clip.posterUrl ?? posterUrl;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`${playing ? "Pause" : "Play"} ${clip.label}`}
      className="group/clip relative aspect-video h-14 shrink-0 overflow-hidden rounded-control bg-input outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
    >
      {playing && src ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          ref={ref}
          src={src}
          poster={still ?? undefined}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : still ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={still}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      {playing && buffering ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Spinner className="h-4 w-4 text-white" />
        </span>
      ) : !playing ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover/clip:opacity-100">
          <Play className="h-4 w-4 text-white" strokeWidth={2} aria-hidden />
        </span>
      ) : null}
      <span className="absolute right-1 bottom-1 rounded-[2px] bg-overlay px-1 text-[10px] leading-tight text-background tabular-nums">
        {formatDuration(clip.endS - clip.startS)}
      </span>
    </button>
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
