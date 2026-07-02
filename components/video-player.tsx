"use client";

// Base layout only (video fills its container, fullscreen, gesture/poster
// visibility) — NOT the default skin. Every control below is our own, styled
// with the design system so nothing of Vidstack's chrome leaks through.
import "@vidstack/react/player/styles/base.css";

import * as React from "react";
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  Gesture,
  Controls,
  type MediaPlayerInstance,
} from "@vidstack/react";
import { type Video } from "@/lib/db/schema";
import {
  BufferingSpinner,
  FullscreenToggle,
  MuteToggle,
  PlayToggle,
  Scrubber,
  TimeReadout,
} from "@/components/player-controls";

/** How often (in seconds of playback) to surface progress upward. */
const PROGRESS_INTERVAL_S = 5;

export type PlayerProgress = { currentTime: number; duration: number };

/**
 * The inline watch player. A thin Vidstack shell — it handles the hard parts
 * (a11y, keyboard: space/k, ←/→, f, m; fullscreen, gestures, buffering) — with
 * a minimal, monochrome control bar of our own. `onProgress` is the seam the
 * watch-events analytics hangs off (throttled; no-op until wired).
 *
 * Player chrome is intentionally theme-independent: a fixed dark scrim + white
 * controls read cleanly over any film in both light and dark mode.
 */
export function VideoPlayer({
  video,
  onProgress,
  allowFullscreen = true,
  controlsOnHover = false,
}: {
  video: Video;
  onProgress?: (p: PlayerProgress) => void;
  /** Off for small inline previews (e.g. the upload editor rail). */
  allowFullscreen?: boolean;
  /**
   * Show controls only on hover/focus rather than whenever paused — a lighter
   * feel for previews. Click-to-play still works via the gesture overlay.
   */
  controlsOnHover?: boolean;
}) {
  const playerRef = React.useRef<MediaPlayerInstance>(null);
  const lastSent = React.useRef(0);

  const handleTimeUpdate = React.useCallback(() => {
    if (!onProgress) return;
    const p = playerRef.current;
    if (!p) return;
    const { currentTime, duration } = p.state;
    // Fire on forward progress past the interval, or on any seek-back.
    if (
      currentTime - lastSent.current >= PROGRESS_INTERVAL_S ||
      currentTime < lastSent.current
    ) {
      lastSent.current = currentTime;
      onProgress({ currentTime, duration });
    }
  }, [onProgress]);

  return (
    <MediaPlayer
      ref={playerRef}
      title={video.title}
      src={video.storagePath ?? undefined}
      poster={video.posterUrl ?? undefined}
      aspectRatio="16/9"
      playsInline
      onTimeUpdate={handleTimeUpdate}
      className="group/player relative w-full overflow-hidden rounded-card bg-black shadow-project"
    >
      <MediaProvider />

      {video.posterUrl && (
        <Poster
          src={video.posterUrl}
          alt={video.title}
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 data-[visible]:opacity-100"
        />
      )}

      {/* Click to play/pause, double-click for fullscreen (Vimeo-style). */}
      <Gesture
        className="absolute inset-0 z-0 block"
        event="pointerup"
        action="toggle:paused"
      />
      {allowFullscreen && (
        <Gesture
          className="absolute inset-0 z-0 block"
          event="dblpointerup"
          action="toggle:fullscreen"
        />
      )}

      <BufferingSpinner />

      <Controls.Root
        className={
          "absolute inset-0 z-10 flex flex-col justify-end opacity-0 transition-opacity duration-200 " +
          (controlsOnHover
            ? // Hover/focus-driven: invisible and non-interactive at rest so the
              // click-to-play gesture underneath still fires across the frame.
              "pointer-events-none group-hover/player:pointer-events-auto group-hover/player:opacity-100 group-focus-within/player:pointer-events-auto group-focus-within/player:opacity-100"
            : // Default: Vidstack's managed visibility (shown while paused/idle).
              "data-[visible]:opacity-100")
        }
      >
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
        <Controls.Group className="relative flex flex-col gap-1.5 px-3 pb-2.5 sm:px-4 sm:pb-3">
          <Scrubber />
          <div className="flex items-center gap-3 text-white">
            <PlayToggle />
            <MuteToggle />
            <TimeReadout />
            {allowFullscreen && <FullscreenToggle className="ml-auto" />}
          </div>
        </Controls.Group>
      </Controls.Root>
    </MediaPlayer>
  );
}
