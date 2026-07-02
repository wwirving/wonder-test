"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ALL_TAGS, PROJECTS } from "@/lib/data";
import { SearchFilter } from "@/components/search-filter";
import { ViewSelector, type ViewMode } from "@/components/view-selector";
import { ProjectCard } from "@/components/project-card";

/**
 * Client container that ties together the search bar, the list/grid toggle,
 * and the project collection — the same three pieces of state the source
 * site coordinates.
 */
export function Gallery() {
  const [view, setView] = React.useState<ViewMode>("list");
  const [activeTags, setActiveTags] = React.useState<string[]>([]);

  const projects = React.useMemo(() => {
    if (activeTags.length === 0) return PROJECTS;
    return PROJECTS.filter((p) =>
      activeTags.every((t) => p.tags.includes(t))
    );
  }, [activeTags]);

  return (
    <>
      <SearchFilter allTags={ALL_TAGS} active={activeTags} onChange={setActiveTags} />

      <div className="mb-8">
        <ViewSelector view={view} onChange={setView} />
      </div>

      <div
        className={cn(
          "mx-auto flex w-full px-5",
          view === "grid"
            ? "max-w-none flex-row flex-wrap items-start gap-5 gap-y-20"
            : "max-w-[1920px] flex-col items-center justify-start"
        )}
      >
        {projects.map((p) => (
          <div
            key={p.id}
            className={cn(
              view === "grid" &&
                "w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.833rem)]"
            )}
          >
            <ProjectCard project={p} view={view} />
          </div>
        ))}

        {projects.length === 0 && (
          <p className="w-full py-20 text-center text-small text-muted">
            No projects match those filters.
          </p>
        )}
      </div>
    </>
  );
}
