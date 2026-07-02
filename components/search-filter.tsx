"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { FilterTag } from "@/components/tag";

function Highlight({ text, query }: { text: string; query: string }) {
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (!query || i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-normal text-foreground">
        {text.slice(i, i + query.length)}
      </mark>
      {text.slice(i + query.length)}
    </>
  );
}

/**
 * Frosted search / tag-filter bar (source: `.filter-wrapper`).
 * Type to filter the tag vocabulary, Enter/click to add a filter chip,
 * click a chip to remove it, "Clear all" to reset.
 */
export function SearchFilter({
  allTags,
  active,
  onChange,
}: {
  allTags: string[];
  active: string[];
  onChange: (tags: string[]) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const [cursor, setCursor] = React.useState(0);

  const suggestions = React.useMemo(
    () =>
      allTags.filter(
        (t) =>
          !active.includes(t) &&
          t.toLowerCase().includes(query.toLowerCase())
      ),
    [allTags, active, query]
  );

  const open = focused && suggestions.length > 0;

  function add(tag: string) {
    if (!active.includes(tag)) onChange([...active, tag]);
    setQuery("");
    setCursor(0);
  }
  function toggle(tag: string) {
    onChange(active.includes(tag) ? active.filter((t) => t !== tag) : [...active, tag]);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions[cursor]) add(suggestions[cursor]);
    }
  }

  return (
    <section className="pointer-events-none fixed top-0 left-1/2 z-110 w-72 -translate-x-1/2 pt-20 sm:pt-5">
      <div className="pointer-events-auto relative block h-10 w-full text-small">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={onKeyDown}
          placeholder="Filter"
          aria-label="Filter projects by tag"
          className="frosted h-full w-full rounded-control border-0 px-3 leading-none text-foreground outline-none transition-all placeholder:text-subtle focus:placeholder:text-muted"
        />

        {/* clear-all */}
        {active.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="absolute top-0 right-0 flex h-10 cursor-pointer items-center px-3 text-xsmall leading-none text-subtle outline-none select-none"
          >
            <span className="border-b border-dotted border-current">Clear</span>
          </button>
        )}

        {/* suggestions dropdown */}
        {open && (
          <ul className="frosted absolute top-[calc(100%+1px)] left-0 z-10 w-full rounded-control py-1.5 select-none">
            {suggestions.map((s, i) => (
              <li
                key={s}
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(s);
                }}
                onMouseEnter={() => setCursor(i)}
                className={cn(
                  "mx-[3px] flex h-7 cursor-pointer items-center rounded-control px-2.5 pb-px leading-none text-subtle transition-colors",
                  i === cursor && "bg-hover"
                )}
              >
                <Highlight text={s} query={query} />
              </li>
            ))}
          </ul>
        )}

        {/* active filter chips */}
        {active.length > 0 && (
          <div className="absolute top-[calc(100%+0.5rem)] left-1/2 flex w-max -translate-x-1/2 flex-wrap justify-center gap-1">
            {active.map((t) => (
              <FilterTag key={t} label={t} active onToggle={() => toggle(t)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
