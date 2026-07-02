"use client";

import * as React from "react";
import { X } from "lucide-react";

/**
 * Open-vocabulary tag input for mood/themes and free-form tags. Type + Enter (or
 * comma) to add a chip; Backspace on an empty field removes the last one. Case-
 * insensitive de-dupe. Genre, by contrast, is a *closed* list rendered as
 * toggles in the details panel — this is only for the free fields.
 */
export function ChipInput({
  values,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  "aria-label"?: string;
}) {
  const [draft, setDraft] = React.useState("");

  function add(raw: string) {
    const value = raw.trim().replace(/,$/, "");
    if (!value) return;
    if (!values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      onChange([...values, value]);
    }
    setDraft("");
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-control bg-input px-2 py-2 transition focus-within:outline focus-within:outline-1 focus-within:-outline-offset-1 focus-within:outline-muted">
      {values.map((value, i) => (
        <span
          key={value}
          className="inline-flex items-center gap-1 rounded-control bg-surface px-2 py-1 text-xsmall text-subtle shadow-border"
        >
          {value}
          <button
            type="button"
            onClick={() => removeAt(i)}
            aria-label={`Remove ${value}`}
            className="text-muted transition hover:text-foreground"
          >
            <X className="h-3 w-3" strokeWidth={1.75} aria-hidden />
          </button>
        </span>
      ))}
      <input
        value={draft}
        aria-label={ariaLabel}
        placeholder={values.length ? "" : placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && values.length) {
            removeAt(values.length - 1);
          }
        }}
        onBlur={() => add(draft)}
        className="h-7 min-w-24 flex-1 bg-transparent px-1 text-small text-foreground outline-none placeholder:text-muted"
      />
    </div>
  );
}
