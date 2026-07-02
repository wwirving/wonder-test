"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Drag-and-drop file target, modelled on the dice-ui `FileUpload` primitive but
 * restyled onto the Wonder tokens (dashed frosted well, control radius, muted
 * copy). Deliberately dumb: it validates against `accept`/`maxSize` and emits a
 * single `File` — the surrounding flow owns progress, preview, and hand-off.
 */
export interface FileUploadProps {
  /** `<input accept>` list, e.g. "video/mp4,video/quicktime,video/webm". */
  accept?: string;
  /** Max file size in bytes; larger files are rejected via `onError`. */
  maxSize?: number;
  onSelect: (file: File) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  className?: string;
  label?: React.ReactNode;
  /** Small print under the label — accepted formats / size cap. */
  hint?: React.ReactNode;
}

/** Lenient accept match: honours `type/*`, exact mime, and `.ext` tokens. */
function accepts(file: File, accept?: string): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  return accept.split(",").some((raw) => {
    const token = raw.trim().toLowerCase();
    if (!token) return false;
    if (token.startsWith(".")) return name.endsWith(token);
    if (token.endsWith("/*")) return file.type.startsWith(token.slice(0, -1));
    return file.type === token;
  });
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function FileUpload({
  accept,
  maxSize,
  onSelect,
  onError,
  disabled,
  className,
  label = "Drop a video, or",
  hint,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);

  function validate(file: File) {
    if (!accepts(file, accept)) {
      onError?.("That file type isn’t supported.");
      return;
    }
    if (maxSize && file.size > maxSize) {
      onError?.(`File is too large. Max ${formatBytes(maxSize)}.`);
      return;
    }
    onSelect(file);
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragActive(true);
      }}
      onDragLeave={(e) => {
        // Ignore leaves into descendants — only clear when leaving the well.
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDragActive(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        if (disabled) return;
        const file = e.dataTransfer.files?.[0];
        if (file) validate(file);
      }}
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed px-6 py-12 text-center outline-none transition",
        disabled
          ? "pointer-events-none opacity-50"
          : "cursor-pointer hover:bg-hover focus-visible:border-foreground",
        dragActive
          ? "border-foreground bg-hover"
          : "border-[var(--input-strong)] hover:border-muted",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) validate(file);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />

      <p className="text-small text-subtle">
        {label}{" "}
        <span className="border-b border-dotted border-current text-foreground">
          browse
        </span>
      </p>

      {hint ? <p className="mt-1.5 text-xsmall text-muted">{hint}</p> : null}
    </div>
  );
}

export { formatBytes };
