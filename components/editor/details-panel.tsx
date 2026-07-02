"use client";

import type { Credit } from "@/lib/db/schema";
import { GENRES } from "@/lib/constants";
import { FilterTag } from "@/components/tag";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChipInput } from "@/components/editor/chip-input";
import { CreditsField } from "@/components/editor/credits-field";

/**
 * The "hard metadata" the creator owns — title, story, credits, and the
 * discovery signals (genre/mood/tags). Deliberately free of AI chrome: this is
 * their tab. Twelve Labs suggestions live on the Auto-tags tab and only appear
 * here once the creator chooses to apply them.
 */
export type DetailsForm = {
  title: string;
  synopsis: string;
  director: string;
  credits: Credit[];
  genre: string[];
  moodTags: string[];
  tags: string[];
};

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-small text-foreground">
          {label}
          {required ? <span className="text-muted"> *</span> : null}
        </label>
        {hint ? <span className="text-xsmall text-muted">{hint}</span> : null}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function DetailsPanel({
  form,
  onChange,
}: {
  form: DetailsForm;
  onChange: (patch: Partial<DetailsForm>) => void;
}) {
  function toggleGenre(g: string) {
    onChange({
      genre: form.genre.includes(g)
        ? form.genre.filter((x) => x !== g)
        : [...form.genre, g],
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Field label="Title" htmlFor="title" required>
        <Input
          id="title"
          value={form.title}
          placeholder="Your film's title"
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </Field>

      <Field label="Description" htmlFor="synopsis" hint="What's it about?">
        <Textarea
          id="synopsis"
          value={form.synopsis}
          placeholder="A short logline or description viewers will see on the watch page."
          onChange={(e) => onChange({ synopsis: e.target.value })}
        />
      </Field>

      <Field label="Director" htmlFor="director">
        <Input
          id="director"
          value={form.director}
          placeholder="Who directed it?"
          onChange={(e) => onChange({ director: e.target.value })}
          className="sm:max-w-sm"
        />
      </Field>

      <Field label="Cast & credits" hint="Optional">
        <CreditsField
          value={form.credits}
          onChange={(credits) => onChange({ credits })}
        />
      </Field>

      <Field label="Genre" hint="Pick from the catalogue">
        <div className="flex flex-wrap gap-1.5">
          {GENRES.map((g) => (
            <FilterTag
              key={g}
              label={g}
              active={form.genre.includes(g)}
              onToggle={() => toggleGenre(g)}
            />
          ))}
        </div>
      </Field>

      <Field label="Mood / Themes" hint="Optional">
        <ChipInput
          aria-label="Mood and themes"
          values={form.moodTags}
          onChange={(moodTags) => onChange({ moodTags })}
          placeholder="e.g. Wistful, Nocturnal. Press Enter to add"
        />
      </Field>

      <Field label="Tags" hint="Optional">
        <ChipInput
          aria-label="Tags"
          values={form.tags}
          onChange={(tags) => onChange({ tags })}
          placeholder="Keywords like format, subject, technique"
        />
      </Field>
    </div>
  );
}
