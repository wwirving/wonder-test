"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSessionId } from "@/lib/session";
import { Button } from "@/components/ui/button";

const ENDPOINT = "/api/loves";
const STORE_KEY = "wtv_loved";

/**
 * Read the set of video ids this browser has loved from localStorage. This is
 * the "render it on subsequent visits" memory: the filled state survives a
 * reload without a round-trip, keyed off the same browser identity the server
 * counts by (so it stays consistent with the persisted count).
 */
function readLoved(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeLoved(videoId: string, loved: boolean) {
  try {
    const map = readLoved();
    if (loved) map[videoId] = true;
    else delete map[videoId];
    localStorage.setItem(STORE_KEY, JSON.stringify(map));
  } catch {
    // Storage unavailable (private mode / quota) — server state still persists.
  }
}

/**
 * A "love" toggle for the watch page. Local state gives an instant, no-flash
 * fill on repeat visits; every tap also persists to the server (keyed by the
 * anonymous session id) so the aggregate count can surface in creator
 * analytics. Optimistic: the count updates immediately, then reconciles to the
 * authoritative total the server returns.
 */
export function LoveButton({
  videoId,
  initialCount,
}: {
  videoId: string;
  initialCount: number;
}) {
  const [loved, setLoved] = React.useState(false);
  const [count, setCount] = React.useState(initialCount);

  // Hydrate the loved flag from localStorage after mount (SSR has no storage).
  // The initial count already includes this session's love if it persisted, so
  // no count adjustment is needed here — only the fill state.
  React.useEffect(() => {
    setLoved(Boolean(readLoved()[videoId]));
  }, [videoId]);

  const toggle = () => {
    const next = !loved;
    setLoved(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    writeLoved(videoId, next);

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, sessionId: getSessionId(), loved: next }),
      keepalive: true,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        // Reconcile to the server's authoritative count when it gives one
        // (mock mode / errors return null and the optimistic count stands).
        if (data && typeof data.loves === "number") setCount(data.loves);
      })
      .catch(() => {});
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={toggle}
      aria-pressed={loved}
      aria-label={loved ? "Remove your love" : "Love this film"}
      className="shrink-0 gap-1.5"
    >
      <Heart
        className={cn(
          "size-4 transition",
          loved ? "fill-foreground text-foreground" : "text-muted",
        )}
        strokeWidth={1.5}
        aria-hidden
      />
      <span className="tabular-nums text-foreground">{count}</span>
    </Button>
  );
}
