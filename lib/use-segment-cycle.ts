"use client";

import * as React from "react";

export type Segment = { startS: number; endS: number };

/**
 * Track whether a `<video>` is buffering while `active`, so callers can show a
 * spinner. Starts true on activation (nothing decoded yet) and flips on the
 * element's `waiting`/`playing`/`canplay` events.
 */
export function useVideoBuffering(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  active: boolean,
): boolean {
  const [buffering, setBuffering] = React.useState(false);
  React.useEffect(() => {
    const el = videoRef.current;
    if (!el || !active) {
      setBuffering(false);
      return;
    }
    setBuffering(el.readyState < 3); // HAVE_FUTURE_DATA
    const on = () => setBuffering(true);
    const off = () => setBuffering(false);
    el.addEventListener("waiting", on);
    el.addEventListener("playing", off);
    el.addEventListener("canplay", off);
    return () => {
      el.removeEventListener("waiting", on);
      el.removeEventListener("playing", off);
      el.removeEventListener("canplay", off);
    };
  }, [videoRef, active]);
  return buffering;
}

/**
 * Drive a muted `<video>` through an ordered list of time segments while
 * `active` is true: seek to the first segment's start, play, and on each
 * `timeupdate` jump to the next segment once the current one ends — looping the
 * set. A single segment simply loops itself.
 *
 * Reuses the existing source file (no encoding, no extra fetch beyond the bytes
 * the segments span) and only runs while active, so callers can gate it on hover
 * to keep the discover grid cheap. When inactive the element is paused; the
 * caller owns showing a still frame.
 */
export function useSegmentCycle(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  segments: Segment[],
  active: boolean,
) {
  // Latest segments read via ref so the effect only re-subscribes when the set
  // actually changes (by value), not on every parent render.
  const segsRef = React.useRef(segments);
  segsRef.current = segments;
  const key = segments.map((s) => `${s.startS}:${s.endS}`).join(",");

  React.useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const segs = segsRef.current;
    if (!active || segs.length === 0) {
      el.pause();
      return;
    }

    let i = 0;
    const playFrom = (n: number) => {
      i = n;
      el.currentTime = segs[i].startS;
      el.play().catch(() => {});
    };
    const start = () => playFrom(0);
    const advance = () => playFrom((i + 1) % segs.length);
    const onTime = () => {
      const seg = segs[i];
      if (!seg) return;
      // Advance when we pass the segment end (or drift before its start).
      if (el.currentTime >= seg.endS || el.currentTime < seg.startS - 0.5) {
        advance();
      }
    };
    // If a segment's end sits at the file's end, `timeupdate` stops before we
    // wrap — `ended` catches that so the set keeps looping (was stalling on the
    // last clip).
    const onEnded = () => advance();

    if (el.readyState >= 1) start();
    else {
      el.addEventListener("loadedmetadata", start, { once: true });
      // Cards use preload="none" — kick the metadata load so we can seek to the
      // first segment (nothing streams until this hover).
      el.load();
    }
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("loadedmetadata", start);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
      el.pause();
    };
  }, [videoRef, active, key]);
}
