import type { Metadata } from "next";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { VideoList } from "@/components/dashboard/video-list";
import { db } from "@/lib/db/client";
import { getCreatorDashboardView } from "@/lib/services/analytics";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Live aggregates over watch_events — never cache.
export const dynamic = "force-dynamic";

/**
 * Creator dashboard: catalogue-wide engagement up top, then the creator's
 * videos (drafts + published) as scannable rows that drill into the editor.
 * Retention-first throughout. Watch-through and completion.
 */
export default async function DashboardPage() {
  const { totals, videos } = await getCreatorDashboardView(db);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-5 pt-[var(--margin-main-top)] pb-24">
      <header className="animate-enter">
        <h1 className="text-medium text-foreground">Dashboard</h1>
        <p className="mt-2 text-small text-muted">
          How your films are being watched.
        </p>
      </header>

      <div className="animate-enter [animation-delay:80ms]">
        <OverviewStats totals={totals} />
      </div>

      <div className="animate-enter [animation-delay:160ms]">
        <VideoList videos={videos} />
      </div>
    </main>
  );
}
