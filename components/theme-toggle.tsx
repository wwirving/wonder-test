"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * The pill toggle from the site header. It's a real checkbox (accessible,
 * keyboard-focusable) styled as a sliding switch. Checked = dark.
 *
 * Exact spec from source:
 *  - track: --input-strong, border-radius 1em, 1.9em × 1em, padding .05em
 *  - knob:  .9em, --surface normally, --muted when checked
 *  - motion: transform var(--dur-long) cubic-bezier(.63,-.02,.2,1)
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <label
      className={cn(
        "relative inline-block cursor-pointer rounded-full bg-input-strong",
        className
      )}
      style={{ fontSize: "1.25rem", width: "1.9em", height: "1em", padding: "0.05em" }}
      title="Toggle color mode"
    >
      <span className="sr-only">Toggle color mode</span>
      <input
        type="checkbox"
        aria-label="Toggle color mode"
        className="absolute cursor-pointer opacity-0"
        checked={isDark}
        onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
      />
      <span
        aria-hidden
        className="block rounded-full"
        style={{
          width: "0.9em",
          height: "0.9em",
          backgroundColor: isDark ? "var(--muted)" : "var(--surface)",
          transform: isDark ? "translate3d(100%,0,0)" : "translate3d(0,0,0)",
          transition:
            "transform var(--dur-long) cubic-bezier(.63,-.02,.2,1), background-color 0s",
        }}
      />
    </label>
  );
}
