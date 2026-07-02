"use client";

import * as React from "react";
import { VideoPlayer, type PlayerProgress } from "@/components/video-player";
import { type Video } from "@/lib/db/schema";

const SESSION_KEY = "wtv_session";
const ENDPOINT = "/api/watch-events";

/** A stable per-browser id so retention can be measured without accounts. */
function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/**
 * Thin analytics wrapper around the (pure) player. The page can't hand a
 * callback across the server→client boundary, so this island owns the session
 * id and turns the player's throttled `onProgress` into `watch_events` pings.
 * On tab-hide it flushes the furthest position via `sendBeacon`, so progress
 * made between throttle ticks isn't lost when the viewer leaves.
 */
export function WatchPlayer({ video }: { video: Video }) {
  const sessionRef = React.useRef("");
  const lastRef = React.useRef<PlayerProgress | null>(null);

  React.useEffect(() => {
    sessionRef.current = getSessionId();
  }, []);

  const send = React.useCallback(
    (p: PlayerProgress, beacon = false) => {
      if (!p.duration || !sessionRef.current) return;
      const body = JSON.stringify({
        videoId: video.id,
        sessionId: sessionRef.current,
        watchedSeconds: p.currentTime,
        videoDuration: p.duration,
      });
      if (beacon && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(
          ENDPOINT,
          new Blob([body], { type: "application/json" }),
        );
      } else {
        void fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    },
    [video.id],
  );

  const handleProgress = React.useCallback(
    (p: PlayerProgress) => {
      lastRef.current = p;
      send(p);
    },
    [send],
  );

  React.useEffect(() => {
    const flush = () => {
      if (lastRef.current) send(lastRef.current, true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [send]);

  return <VideoPlayer video={video} onProgress={handleProgress} />;
}
