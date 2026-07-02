"use client";

import * as React from "react";
import { Globe, Lock, Upload } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { blurImageFor } from "@/lib/avatar";
import type { Video } from "@/lib/db/schema";
import { VideoPlayer } from "@/components/video-player";
import { AiStatusLine, type AiStatus } from "@/components/editor/status";

type AccessTier = Video["accessTier"];

/** Auto-grabbed frame stand-ins (mock). The creator can also upload their own. */
const POSTER_OPTIONS = [
  "/video/mock-poster.webp",
  blurImageFor("frame-a"),
  blurImageFor("frame-b"),
];

/**
 * The persistent left rail: the live preview player, poster picker, and the
 * publish-adjacent settings (runtime, access tier, AI enrichment status). Stays
 * in view while the creator works the tabs on the right — "preview and publish"
 * is the constant reference, so it never hides behind a tab.
 */
export function PreviewRail({
  video,
  title,
  posterUrl,
  onSelectPoster,
  customPoster,
  onUploadPoster,
  accessTier,
  onAccessTier,
  aiTags,
  aiClips,
}: {
  video: Video;
  /** Live title from the form, so the preview reflects what's being typed. */
  title: string;
  posterUrl: string | null;
  onSelectPoster: (url: string) => void;
  /** A creator-uploaded poster, if any — occupies the last slot when present. */
  customPoster: string | null;
  onUploadPoster: (file: File) => void;
  accessTier: AccessTier;
  onAccessTier: (tier: AccessTier) => void;
  aiTags: AiStatus;
  aiClips: AiStatus;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const activePoster = posterUrl ?? POSTER_OPTIONS[0];

  // The exact watch-page player, minus fullscreen — a real preview of the film
  // with the currently-selected poster and title.
  const previewVideo: Video = {
    ...video,
    title,
    posterUrl: activePoster,
    storagePath: video.storagePath ?? "/video/mock.mp4",
  };

  return (
    <div className="flex flex-col gap-4">
      <VideoPlayer
        video={previewVideo}
        allowFullscreen={false}
        controlsOnHover
      />

      {/* Poster picker */}
      <section>
        <div className="flex items-baseline justify-between">
          <h3 className="text-small text-foreground">Poster</h3>
          <span className="text-xsmall text-muted">Auto-grabbed frames</span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {POSTER_OPTIONS.map((url, i) => {
            const active = activePoster === url;
            return (
              <button
                key={url + i}
                type="button"
                onClick={() => onSelectPoster(url)}
                aria-label={`Use frame ${i + 1} as poster`}
                aria-pressed={active}
                className={cn(
                  "relative aspect-video overflow-hidden rounded-control outline-offset-2 transition",
                  active
                    ? "outline outline-2 outline-foreground"
                    : "opacity-80 hover:opacity-100",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover",
                    i > 0 && "scale-125 blur-[3px]",
                  )}
                />
              </button>
            );
          })}

          {/* Last slot: the creator's own upload — a poster grab won't always
              beat a designed key-art frame. */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label={customPoster ? "Replace uploaded poster" : "Upload a poster"}
            aria-pressed={!!customPoster && activePoster === customPoster}
            className={cn(
              "relative flex aspect-video items-center justify-center overflow-hidden rounded-control outline-offset-2 transition",
              customPoster
                ? activePoster === customPoster
                  ? "outline outline-2 outline-foreground"
                  : "opacity-80 hover:opacity-100"
                : "border border-dashed border-[var(--input-strong)] text-muted hover:border-muted hover:text-foreground",
            )}
          >
            {customPoster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customPoster}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Upload className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            )}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadPoster(file);
              e.target.value = "";
            }}
          />
        </div>
      </section>

      {/* Settings + enrichment status */}
      <section className="rounded-card bg-surface p-4 shadow-border">
        <div className="flex items-center justify-between text-xsmall">
          <span className="text-muted">Runtime</span>
          <span className="text-foreground tabular-nums">
            {formatDuration(video.runtimeSeconds)}
          </span>
        </div>

        <div className="mt-3">
          <span className="text-xsmall text-muted">Access</span>
          <div className="mt-1.5 flex rounded-control bg-input p-0.5">
            {(
              [
                { tier: "public", label: "Public", Icon: Globe },
                { tier: "members", label: "Members", Icon: Lock },
              ] as const
            ).map(({ tier, label, Icon }) => {
              const on = accessTier === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => onAccessTier(tier)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-[2px] py-1.5 text-xsmall transition",
                    on
                      ? "bg-surface text-foreground shadow-border"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-3 w-3" strokeWidth={1.75} aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-[var(--input-strong)] pt-3">
          <AiStatusLine label="Auto-tags" status={aiTags} />
          <AiStatusLine label="Clips" status={aiClips} />
        </div>
      </section>
    </div>
  );
}
