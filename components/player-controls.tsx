"use client";

// The individual controls for `VideoPlayer`, split out to keep that file focused
// on composition. Each reads media state via Vidstack hooks and is styled with
// our own tokens — fixed white-on-dark chrome that reads over any film.
import {
  PlayButton,
  MuteButton,
  FullscreenButton,
  TimeSlider,
  useMediaState,
} from "@vidstack/react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Loader2,
} from "lucide-react";
import { formatRuntime } from "@/lib/format";

/** Shared 40px hit-area icon button. */
const iconBtn =
  "inline-flex h-10 w-10 items-center justify-center rounded-control text-white transition-colors hover:bg-white/15 focus-visible:bg-white/15 focus-visible:outline-none";

export function PlayToggle() {
  const paused = useMediaState("paused");
  return (
    <PlayButton className={iconBtn}>
      {paused ? (
        // Optical shift: a play triangle's visual centre sits right of geometric.
        <Play className="h-5 w-5 translate-x-[1.5px] fill-current" />
      ) : (
        <Pause className="h-5 w-5 fill-current" />
      )}
    </PlayButton>
  );
}

export function MuteToggle() {
  const muted = useMediaState("muted");
  const volume = useMediaState("volume");
  const silent = muted || volume === 0;
  return (
    <MuteButton className={iconBtn}>
      {silent ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
    </MuteButton>
  );
}

export function FullscreenToggle({ className }: { className?: string }) {
  const isFullscreen = useMediaState("fullscreen");
  return (
    <FullscreenButton className={`${iconBtn} ${className ?? ""}`}>
      {isFullscreen ? (
        <Minimize className="h-5 w-5" />
      ) : (
        <Maximize className="h-5 w-5" />
      )}
    </FullscreenButton>
  );
}

export function TimeReadout() {
  const currentTime = useMediaState("currentTime");
  const duration = useMediaState("duration");
  return (
    <span className="text-xsmall tabular-nums text-white/90 select-none">
      {formatRuntime(currentTime)}
      <span className="text-white/45"> / {formatRuntime(duration)}</span>
    </span>
  );
}

export function Scrubber() {
  return (
    <TimeSlider.Root className="group/slider relative flex h-5 w-full cursor-pointer touch-none items-center select-none">
      <TimeSlider.Track className="relative h-[3px] w-full rounded-full bg-white/25">
        <TimeSlider.Progress
          className="absolute inset-y-0 left-0 rounded-full bg-white/20"
          style={{ width: "var(--slider-progress)" }}
        />
        <TimeSlider.TrackFill
          className="absolute inset-y-0 left-0 rounded-full bg-white"
          style={{ width: "var(--slider-fill)" }}
        />
      </TimeSlider.Track>
      <TimeSlider.Thumb
        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover/slider:opacity-100"
        style={{ left: "var(--slider-fill)" }}
      />
    </TimeSlider.Root>
  );
}

export function BufferingSpinner() {
  const waiting = useMediaState("waiting");
  if (!waiting) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-white/80" />
    </div>
  );
}
