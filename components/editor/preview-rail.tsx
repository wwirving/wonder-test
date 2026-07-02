"use client";

import * as React from "react";
import { Globe, Image as ImageIcon, Lock, Upload } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import type { Video } from "@/lib/db/schema";
import { VideoPlayer } from "@/components/video-player";
import { AiStatusLine, type AiStatus } from "@/components/editor/status";

type AccessTier = Video["accessTier"];

/**
 * The persistent left rail: the live preview player, poster, and the
 * publish-adjacent settings (runtime, access tier, AI enrichment status). Stays
 * in view while the creator works the tabs on the right — "preview and publish"
 * is the constant reference, so it never hides behind a tab.
 *
 * The poster is auto-grabbed from the film at upload; the creator can replace it
 * with their own key art. Both are stored in Supabase Storage.
 */
export function PreviewRail({
  video,
  title,
  posterUrl,
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
  onUploadPoster: (file: File) => void;
  accessTier: AccessTier;
  onAccessTier: (tier: AccessTier) => void;
  aiTags: AiStatus;
  aiClips: AiStatus;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);

  // The exact watch-page player, minus fullscreen — a real preview of the film
  // with the current poster and title.
  const previewVideo: Video = { ...video, title, posterUrl };

  return (
    <div className="flex flex-col gap-4">
      <VideoPlayer
        video={previewVideo}
        allowFullscreen={false}
        controlsOnHover
      />

      {/* Poster */}
      <section>
        <div className="flex items-baseline justify-between">
          <h3 className="text-small text-foreground">Poster</h3>
          <span className="text-xsmall text-muted">Auto-grabbed from your film</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-control bg-input">
            {posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={posterUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted">
                <ImageIcon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-control border border-[var(--input-strong)] px-3 py-1.5 text-xsmall text-muted transition hover:border-muted hover:text-foreground"
          >
            <Upload className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            {posterUrl ? "Replace poster" : "Upload poster"}
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
