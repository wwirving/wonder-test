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
  const stats = [
    {
      label: "Videos",
      value: published.toLocaleString("en-US"),
      sub:
        totals.drafts > 0
          ? `${totals.drafts} draft${totals.drafts === 1 ? "" : "s"} in progress`
          : "All published",
    },
    {
      label: "Total views",
      value: totals.views.toLocaleString("en-US"),
      sub: "Across published films",
    },
    {
      label: "Loves",
      value: totals.loves.toLocaleString("en-US"),
      sub: "Across the catalogue",
    },
    {
      label: "Comments",
      value: totals.comments.toLocaleString("en-US"),
      sub: "From the community",
    },
    {
      label: "Avg. watched",
      value: formatPct(totals.meanPctWatched),
      sub: "Mean share of a film played",
    },
    {
      label: "Completion rate",
      value: formatPct(totals.completionRate),
      sub: "Watched 90% or more",
    },
    {
      label: "Avg. watch time",
      value: formatDuration(totals.meanSecondsPlayed),
      sub: "Mean length played",
    },
  ];

  // Stagger each tile left-to-right (index order == reading order, and on
  // lg:grid-cols-7 all seven sit in one row for a clean l>r sweep on entry).
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      {stats.map((s, i) => (
        <Stat
          key={s.label}
          {...s}
          className="animate-enter"
          style={{ animationDelay: `${70 + i * 65}ms` }}
        />
      ))}
    </div>
  );
}
