import Link from "next/link";
import { ChevronRight, Film, Loader2, Sparkles } from "lucide-react";
import { Tag } from "@/components/tag";
import { formatPct, formatRuntime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardVideo } from "@/lib/types";

/**
 * The creator's catalogue as dense, scannable rows — the workspace half of the
 * dashboard. Each row links into the editor: published titles open on their
 * analytics tab, drafts open on details so the creator can finish and publish.
 */
export function VideoList({ videos }: { videos: DashboardVideo[] }) {
  return (
    <section>
      <h2 className="mb-3 text-small text-muted">Your videos</h2>
      {videos.length === 0 ? (
        <Empty />
      ) : (
        <ul className="flex flex-col">
          {videos.map((v) => (
            <li key={v.videoId}>
              <VideoRow video={v} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function VideoRow({ video }: { video: DashboardVideo }) {
  const published = video.status === "published";
  const href = published
    ? `/upload/${video.videoId}?tab=analytics`
    : `/upload/${video.videoId}`;

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-card px-3 py-3 transition hover:bg-hover"
    >
      <Poster url={video.posterUrl} runtimeSeconds={video.runtimeSeconds} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-small text-foreground">
            {video.title || "Untitled film"}
          </h3>
          <Tag className={cn(!published && "text-foreground")}>
            {published ? "Published" : "Draft"}
          </Tag>
          <Nudge video={video} />
        </div>
        <p className="mt-1 text-xsmall tabular-nums text-muted">
          <Metrics video={video} />
        </p>
      </div>

      <ChevronRight
        className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5"
        strokeWidth={1.5}
        aria-hidden
      />
    </Link>
  );
}

/** 16:9 thumbnail, or a placeholder frame when there's no poster yet. */
function Poster({
  url,
  runtimeSeconds,
}: {
  url: string | null;
  runtimeSeconds: number | null;
}) {
  const runtime = formatRuntime(runtimeSeconds);
  return (
    <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-card shadow-border">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="h-full w-full object-cover" src={url} alt="" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-input">
          <Film className="size-4 text-muted" strokeWidth={1.5} aria-hidden />
        </div>
      )}
      {runtime && (
        <span
          className="pointer-events-none absolute right-1 bottom-1 rounded-control px-[0.4em] py-[0.3em] text-[10px] leading-none tabular-nums text-background"
          style={{ backgroundColor: "var(--overlay)" }}
        >
          {runtime}
        </span>
      )}
    </div>
  );
}

/** The metrics line: retention-first when live, status hint when not. */
function Metrics({ video }: { video: DashboardVideo }) {
  if (video.status !== "published") return <>Not yet published</>;
  if (video.views === 0) return <>Published · no views yet</>;
  return (
    <>
      {video.views.toLocaleString("en-US")} views ·{" "}
      {formatPct(video.meanPctWatched)} watched ·{" "}
      {formatPct(video.completionRate)} complete
    </>
  );
}

/**
 * AI-enrichment nudge. Shows on drafts whose Twelve Labs suggestions have
 * arrived (pulling the creator back in to review + publish), or a quiet
 * "indexing" hint while analysis is still running.
 */
function Nudge({ video }: { video: DashboardVideo }) {
  if (video.status !== "draft") return null;

  const ready =
    video.aiTagsStatus === "ready" || video.aiClipsStatus === "ready";
  const processing =
    video.aiTagsStatus === "processing" || video.aiClipsStatus === "processing";

  if (ready) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-xsmall text-foreground">
        <Sparkles className="size-3" strokeWidth={1.75} aria-hidden />
        Suggestions ready
      </span>
    );
  }
  if (processing) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-xsmall text-muted">
        <Loader2 className="size-3 animate-spin" strokeWidth={1.75} aria-hidden />
        Indexing…
      </span>
    );
  }
  return null;
}

function Empty() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-[var(--input-strong)] px-6 py-12 text-center">
      <Film className="size-5 text-muted" strokeWidth={1.5} aria-hidden />
      <p className="text-small text-foreground">No videos yet</p>
      <p className="max-w-xs text-pretty text-xsmall text-muted">
        Upload your first film to start building an audience. Your engagement
        will show up here as people watch.
      </p>
      <Link
        href="/upload"
        className="mt-2 text-small text-foreground underline underline-offset-4 transition-opacity hover:opacity-65"
      >
        Upload a film
      </Link>
    </div>
  );
}
