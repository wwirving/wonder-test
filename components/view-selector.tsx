"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "grid";

/**
 * Segmented List / Grid switch. A frosted track holds a sliding pill that
 * animates under the active label — the pill's position/size is measured
 * from the real buttons so it works with any label lengths.
 */
export function ViewSelector({
  view,
  onChange,
  className,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
  className?: string;
}) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const refs = {
    list: React.useRef<HTMLButtonElement>(null),
    grid: React.useRef<HTMLButtonElement>(null),
  };
  const [pill, setPill] = React.useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const measure = React.useCallback(() => {
    const el = refs[view].current;
    const wrap = wrapRef.current;
    if (!el || !wrap) return;
    setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [view]);

  React.useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <div
      className={cn(
        "flex w-full justify-center px-5 text-small select-none",
        className
      )}
    >
      <div
        ref={wrapRef}
        className="relative flex h-10 cursor-pointer justify-center rounded-selector bg-input p-[3px]"
      >
        {/* sliding indicator */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-[3px] rounded-selector bg-background transition-all dark:bg-muted dark:opacity-75"
          style={{
            height: "calc(100% - 6px)",
            left: pill.left,
            width: pill.width,
          }}
        />
        {(["list", "grid"] as const).map((v) => (
          <button
            key={v}
            ref={refs[v]}
            onClick={() => onChange(v)}
            aria-pressed={view === v}
            className={cn(
              "relative z-1 h-full cursor-pointer appearance-none border-0 bg-transparent px-2.5 capitalize outline-none transition-colors",
              view === v
                ? "text-subtle dark:text-foreground"
                : "text-muted"
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
