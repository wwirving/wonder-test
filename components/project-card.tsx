"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/data";
import type { ViewMode } from "@/components/view-selector";
import { DataTable } from "@/components/data-table";
import { Tag } from "@/components/tag";

// Shared look for the frosted hover pills (source: `.tag.link-open`).
// All sizing is em-relative to text-xsmall, exactly like the source:
// padding .5em, margin .2em, icon 1em wide / .9em tall, gaps .25em.
const MEDIA_PILL =
  "frosted pointer-events-auto m-[0.2em] inline-flex items-center rounded-control p-[0.5em] text-xsmall leading-none text-background outline-none transition active:scale-95";

/** A frosted pill button overlaid on the media on hover. */
function MediaButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      className={cn(MEDIA_PILL, className)}
      style={{ backgroundColor: "var(--overlay)" }}
      {...props}
    >
      {children}
    </button>
  );
}

function ProjectMedia({ project }: { project: Project }) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(project.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="group relative block overflow-hidden rounded-card shadow-project">
      <div
        className="relative w-full"
        style={{ aspectRatio: String(project.media.aspectRatio) }}
      >
        {project.media.video ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={project.media.video}
            poster={project.media.poster}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src={project.media.poster}
            alt={project.title}
          />
        )}
      </div>

      {/* hover-reveal actions */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className={MEDIA_PILL}
          style={{ backgroundColor: "var(--overlay)" }}
        >
          Open website <span className="ml-[0.25em]">↗</span>
        </a>
        <MediaButton onClick={copy} aria-label="Copy link">
          {copied ? "Copied" : "Copy link"}
          {copied ? (
            <Check className="ml-[0.25em] h-[0.9em] w-[1em]" strokeWidth={1.5} />
          ) : (
            <Copy className="ml-[0.25em] h-[0.9em] w-[1em]" strokeWidth={1.5} />
          )}
        </MediaButton>
      </div>
    </div>
  );
}

export function ProjectCard({
  project,
  view,
}: {
  project: Project;
  view: ViewMode;
}) {
  const isGrid = view === "grid";

  return (
    <article
      className={cn(
        "block w-full",
        isGrid
          ? "mb-0"
          : "mx-auto mb-[var(--margin-xl)] max-w-[60rem]"
      )}
    >
      <div className={cn(isGrid ? "mb-5" : "mb-[var(--margin-sm2)]")}>
        <ProjectMedia project={project} />
      </div>

      <div className={cn("mx-auto block", isGrid ? "" : "max-w-[53rem]")}>
        {/* project name — subtitle in list view, title in grid view */}
        <h2
          className={cn(
            "mb-1.5 block text-small",
            isGrid ? "text-foreground" : "text-muted"
          )}
        >
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-65"
          >
            {project.title}
          </a>
        </h2>

        {!isGrid && (
          <>
            <p className="mb-[var(--margin-sm)] block text-medium">
              {project.description}
            </p>

            <DataTable project={project} />

            {project.recognition?.length ? (
              <div className="mt-6 flex items-start text-xsmall">
                <h3 className="w-1/6 text-muted">Recognition</h3>
                <ul className="w-5/6">
                  {project.recognition.map((r, i, arr) => (
                    <li key={r.name} className="inline">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-opacity hover:opacity-65"
                      >
                        {r.name}
                      </a>
                      {i < arr.length - 1 ? ", " : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}

        {/* tags */}
        <aside
          className={cn(
            "flex flex-wrap gap-1 text-small",
            isGrid ? "mt-[var(--margin-xs)]" : "mt-[var(--margin-sm)]"
          )}
        >
          {project.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </aside>
      </div>
    </article>
  );
}
