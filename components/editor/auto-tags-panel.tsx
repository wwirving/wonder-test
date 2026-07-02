"use client";

import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiTagSuggestions } from "@/lib/twelve-labs/types";
import { Spinner, type AiStatus } from "@/components/editor/status";

/**
 * The AI review tab. Twelve Labs' auto-tags live *here*, apart from the human
 * metadata form — the creator pulls suggestions into their details rather than
 * having AI written into their fields. Everything is opt-in and one tap.
 */

type ApplyField = "synopsis" | "moodTags" | "tags";

const has = (arr: string[], v: string) =>
  arr.some((x) => x.toLowerCase() === v.toLowerCase());

export function AutoTagsPanel({
  status,
  suggestions,
  form,
  onApply,
  onApplyAll,
}: {
  status: AiStatus;
  suggestions: AiTagSuggestions | null;
  form: { synopsis: string; moodTags: string[]; tags: string[] };
  onApply: (field: ApplyField, value: string) => void;
  onApplyAll: () => void;
}) {
  if (status === "pending" || status === "processing") {
    return (
      <p className="flex items-center gap-2 rounded-control bg-input px-3 py-2.5 text-xsmall text-subtle">
        <Spinner />
        Analyzing your video. Genre, mood and tag suggestions will appear here
        when they&apos;re ready.
      </p>
    );
  }

  if (status === "failed" || !suggestions) {
    return (
      <div className="rounded-card border border-dashed border-[var(--input-strong)] px-6 py-10 text-center">
        <p className="text-small text-foreground">No suggestions available</p>
        <p className="mx-auto mt-1 max-w-xs text-xsmall text-muted">
          Automatic tagging couldn&apos;t run for this video. Add genre, mood and
          tags yourself in Details.
        </p>
      </div>
    );
  }

  const synopsisApplied =
    form.synopsis.trim().length > 0 &&
    form.synopsis.trim() === suggestions.synopsis.trim();
  const remaining =
    (synopsisApplied ? 0 : 1) +
    suggestions.moodTags.filter((v) => !has(form.moodTags, v)).length +
    suggestions.tags.filter((v) => !has(form.tags, v)).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xsmall text-muted">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-foreground" />
          Suggested by Twelve Labs
        </p>
        {remaining > 0 ? (
          <button
            type="button"
            onClick={onApplyAll}
            className="text-xsmall text-foreground underline-offset-2 transition hover:underline"
          >
            Apply all
          </button>
        ) : (
          <span className="text-xsmall text-muted">All applied</span>
        )}
      </div>

      {/* Description draft — genuinely useful, unlike an auto-title. */}
      <div>
        <p className="text-small text-foreground">Description</p>
        <div className="mt-2 rounded-control border border-dashed border-[var(--input-strong)] p-3">
          <p className="text-small leading-relaxed text-subtle">
            {suggestions.synopsis}
          </p>
          <div className="mt-2.5">
            {synopsisApplied ? (
              <span className="inline-flex items-center gap-1 text-xsmall text-muted">
                <Check className="h-3 w-3" strokeWidth={2} aria-hidden />
                Added to your description
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onApply("synopsis", suggestions.synopsis)}
                className="inline-flex items-center gap-1 text-xsmall text-foreground underline-offset-2 transition hover:underline"
              >
                <Plus className="h-3 w-3" strokeWidth={1.75} aria-hidden />
                Use as description
              </button>
            )}
          </div>
        </div>
      </div>

      <ChipGroup
        label="Mood / Themes"
        values={suggestions.moodTags}
        applied={form.moodTags}
        onApply={(v) => onApply("moodTags", v)}
      />
      <ChipGroup
        label="Tags"
        values={suggestions.tags}
        applied={form.tags}
        onApply={(v) => onApply("tags", v)}
      />

      <p className="text-xsmall text-muted">
        Applied suggestions land in the Details tab, where they stay fully
        editable.
      </p>
    </div>
  );
}

function ChipGroup({
  label,
  values,
  applied,
  onApply,
}: {
  label: string;
  values: string[];
  applied: string[];
  onApply: (value: string) => void;
}) {
  if (values.length === 0) return null;
  return (
    <div>
      <p className="text-small text-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.map((v) => {
          const isApplied = has(applied, v);
          return (
            <button
              key={v}
              type="button"
              disabled={isApplied}
              onClick={() => onApply(v)}
              className={cn(
                "inline-flex items-center gap-1 rounded-control px-2 py-1 text-xsmall transition select-none",
                isApplied
                  ? "bg-input text-muted"
                  : "border border-dashed border-[var(--input-strong)] text-subtle hover:border-foreground hover:text-foreground active:scale-[0.97]",
              )}
            >
              {v}
              {isApplied ? (
                <Check className="h-3 w-3" strokeWidth={2} aria-hidden />
              ) : (
                <Plus className="h-3 w-3 opacity-60" strokeWidth={1.75} aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
