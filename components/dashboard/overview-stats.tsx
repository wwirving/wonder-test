import { Stat } from "@/components/stat-tile";
import { formatPct } from "@/lib/format";
import { formatDuration } from "@/lib/utils";
import type { DashboardTotals } from "@/lib/types";

/**
 * Catalogue-wide roll-up at the top of the dashboard. Retention-first: views are
 * context, watch-through and completion are the headline for a taste-led
 * catalogue.
 */
export function OverviewStats({ totals }: { totals: DashboardTotals }) {
  const published = totals.videos - totals.drafts;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      <Stat
        label="Videos"
        value={published.toLocaleString("en-US")}
        sub={
          totals.drafts > 0
            ? `${totals.drafts} draft${totals.drafts === 1 ? "" : "s"} in progress`
            : "All published"
        }
      />
      <Stat
        label="Total views"
        value={totals.views.toLocaleString("en-US")}
        sub="Across published films"
      />
      <Stat
        label="Avg. watched"
        value={formatPct(totals.meanPctWatched)}
        sub="Mean share of a film played"
      />
      <Stat
        label="Completion rate"
        value={formatPct(totals.completionRate)}
        sub="Watched 90% or more"
      />
      <Stat
        label="Avg. watch time"
        value={formatDuration(totals.meanSecondsPlayed)}
        sub="Mean length played"
      />
    </div>
  );
}
