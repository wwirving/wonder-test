"use client";

import { BarChart3 } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import type { VideoAnalytics } from "@/lib/types";

/**
 * Per-video engagement. Empty before publishing (there's nothing to measure
 * yet); once live it reports retention-first metrics — for a taste-led
 * catalogue, watch-through and completion matter more than raw views. This is
 * the surface the creator dashboard links into for a single title.
 *
 * MOCK: `analytics` stands in for `getVideoAnalytics(db, id)` over `watch_events`.
 */
export function AnalyticsPanel({
  published,
  analytics,
}: {
  published: boolean;
  analytics: VideoAnalytics | null;
}) {
  if (!published || !analytics) {
    return (
      <Empty
        title="No analytics yet"
        body="Once your film is published, you'll see views, watch-through and completion rate here as people watch."
      />
    );
  }

  if (analytics.views === 0) {
    return (
      <Empty
        title="Published, no views yet"
        body="Check back as people start watching. Your engagement metrics will build here."
      />
    );
  }

  const pct = (x: number) => `${Math.round(x * 100)}%`;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Views" value={analytics.views.toLocaleString("en-US")} />
        <Stat
          label="Avg. watched"
          value={pct(analytics.meanPctWatched)}
          sub="Mean share of the film played"
        />
        <Stat
          label="Completion rate"
          value={pct(analytics.completionRate)}
          sub="Watched 90% or more"
        />
        <Stat
          label="Avg. watch time"
          value={formatDuration(analytics.meanSecondsPlayed)}
          sub="Mean length played"
        />
      </div>
      <p className="text-xsmall text-muted">
        Retention over vanity: watch-through and completion tell you more than
        raw views. A per-moment drop-off curve is the natural next step.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-card bg-surface p-4 shadow-border">
      <p className="text-xsmall text-muted">{label}</p>
      <p className="mt-1 text-medium tabular-nums text-foreground">{value}</p>
      {sub ? <p className="mt-0.5 text-xsmall text-muted">{sub}</p> : null}
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-[var(--input-strong)] px-6 py-12 text-center">
      <BarChart3 className="h-5 w-5 text-muted" strokeWidth={1.5} aria-hidden />
      <p className="text-small text-foreground">{title}</p>
      <p className="max-w-xs text-pretty text-xsmall text-muted">{body}</p>
    </div>
  );
}
