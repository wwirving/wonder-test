import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Seconds → clock string ("10:39", "1:02:05"). Used for runtime and clip ranges.
 * Returns "—" for null/NaN so the UI never prints "0:00" for an unknown value.
 */
export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || !Number.isFinite(totalSeconds)) return "—";
  const s = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const mm = hours > 0 ? String(mins).padStart(2, "0") : String(mins);
  return hours > 0
    ? `${hours}:${mm}:${String(secs).padStart(2, "0")}`
    : `${mm}:${String(secs).padStart(2, "0")}`;
}

/**
 * Coerce untrusted input (query params, JSON bodies) to a finite, non-negative
 * number, or `null` if it isn't one. Handy for validating durations/offsets at
 * API boundaries without repeating the same `typeof`/`isFinite` dance.
 */
export function finiteNonNegative(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}
