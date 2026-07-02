import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * A single labelled metric tile — the shared unit for both the per-video
 * analytics panel (`components/editor/analytics-panel.tsx`) and the creator
 * dashboard overview (`components/dashboard/overview-stats.tsx`). Presentational
 * only (no hooks), so it renders in server or client components alike.
 * `className`/`style` pass through so callers can stagger a grid of tiles.
 */
export function Stat({
  label,
  value,
  sub,
  className,
  style,
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("rounded-card bg-surface p-4 shadow-border", className)}
      style={style}
    >
      <p className="text-xsmall text-muted">{label}</p>
      <p className="mt-1 text-medium tabular-nums text-foreground">{value}</p>
      {sub ? <p className="mt-0.5 text-xsmall text-muted">{sub}</p> : null}
    </div>
  );
}
