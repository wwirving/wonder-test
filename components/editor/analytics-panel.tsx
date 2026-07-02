"use client";

import { BarChart3 } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { formatPct } from "@/lib/format";
import { Stat } from "@/components/stat-tile";
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

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Views" value={analytics.views.toLocaleString("en-US")} />
        <Stat
          label="Loves"
          value={analytics.loves.toLocaleString("en-US")}
          sub="Viewers who loved this film"
        />
        <Stat
          label="Comments"
          value={analytics.comments.toLocaleString("en-US")}
          sub="From the community"
        />
        <Stat
          label="Avg. watched"
          value={formatPct(analytics.meanPctWatched)}
          sub="Mean share of the film played"
        />
        <Stat
          label="Completion rate"
          value={formatPct(analytics.completionRate)}
          sub="Watched 90% or more"
        />
        <Stat
          label="Avg. watch time"
          value={formatDuration(analytics.meanSecondsPlayed)}
          sub="Mean length played"
        />
      </div>
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
