"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 10" className={className} aria-hidden>
      <path
        d="M5 0v10M0 5h10"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Small static tag used inside a project card's tag list. */
export function Tag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-control bg-input p-[0.5em] text-xsmall leading-none whitespace-nowrap text-subtle select-none",
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Interactive filter tag (source: `.tag.is-init`).
 * Rest → shows label. Hover → label fades out, a "+" fades in. Active →
 * a faint dark overlay tints the chip and the "+" becomes an "×" (rotate 45°)
 * so hovering an active tag reads as "remove".
 */
export function FilterTag({
  label,
  active,
  onToggle,
  size = "md",
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  /** "sm" scales the whole chip down (padding is em-based) for dense grids. */
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        "group relative inline-flex cursor-pointer rounded-control bg-input p-[0.5em] leading-none whitespace-nowrap text-subtle select-none",
        size === "sm" ? "text-[0.7rem]" : "text-xsmall",
      )}
    >
      {/* darkening overlay when active */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] bg-foreground transition-opacity",
          active ? "opacity-10" : "opacity-0"
        )}
      />
      <span className="pointer-events-none relative transition-opacity group-hover:opacity-0">
        {label}
      </span>
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
      >
        <PlusIcon
          className={cn(
            "h-2.5 w-2.5 transition-transform",
            active ? "rotate-45" : "rotate-0"
          )}
        />
      </span>
    </button>
  );
}
