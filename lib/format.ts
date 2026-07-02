/** Small display-formatting helpers shared by the discover feed and cards. */

/**
 * Runtime in seconds → `m:ss` (or `h:mm:ss` past an hour). Returns "" for
 * null/unknown so callers can omit the badge entirely.
 */
export function formatRuntime(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return "";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

/** A 0..1 ratio → a whole-number percentage string, e.g. 0.615 → "62%". */
export function formatPct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/** Four-digit release year from a Date/ISO string (uses `created_at`). */
export function formatYear(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return Number.isNaN(d.getTime()) ? "" : String(d.getFullYear());
}

/**
 * Compact relative time for comment timestamps, e.g. "just now", "3h ago",
 * "2d ago". Falls back to an absolute date past a week so old threads read clearly.
 */
export function formatRelativeTime(
  date: Date | string | null | undefined,
): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const secs = Math.round((Date.now() - d.getTime()) / 1000);
  if (secs < 45) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

/** 1–2 letter monogram for the creator avatar, e.g. "Jordan Daniel Chesney" → "JC". */
export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}
