import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Creator engagement analytics. Later: server-side aggregates over
 * `watch_events` (views, mean % watched, completion rate) per video.
 */
export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col px-5 pt-[var(--margin-main-top)]">
      <h1 className="text-medium text-foreground">Dashboard</h1>
      <p className="mt-2 text-small text-muted">
        Engagement analytics for your published videos will live here.
      </p>
    </main>
  );
}
