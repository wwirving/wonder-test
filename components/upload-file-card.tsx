"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { blurImageFor } from "@/lib/avatar";
import { formatBytes } from "@/components/ui/file-upload";

/** Selected-file row with progress — shared by the uploading and done phases. */
export function FileCard({
  file,
  progress,
  done,
  onCancel,
}: {
  file: File;
  progress: number;
  done: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="animate-enter rounded-card bg-surface p-4 shadow-border">
      <div className="flex items-center gap-3">
        {/* Blurred stand-in thumbnail (the Discover avatar trick), seeded by the
            file name until a real poster is grabbed. */}
        <span
          aria-hidden
          className="relative h-11 w-11 shrink-0 overflow-hidden rounded-control outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={blurImageFor(file.name)}
            alt=""
            className="absolute inset-0 h-full w-full scale-125 object-cover blur-[4px]"
          />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-small text-foreground">{file.name}</p>
          <p className="text-xsmall text-muted">{formatBytes(file.size)}</p>
        </div>

        {done ? (
          <span className="flex h-8 w-8 items-center justify-center text-foreground">
            <Check className="h-4 w-4" strokeWidth={1.75} />
          </span>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel upload"
            // Visible 32px control; the pseudo-element extends the tap target to
            // 40×40 (min hit area) without shifting layout.
            className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-control text-muted outline-none transition select-none after:absolute after:left-1/2 after:top-1/2 after:size-10 after:-translate-x-1/2 after:-translate-y-1/2 hover:bg-hover hover:text-foreground active:scale-[0.96]"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-input">
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-150 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xsmall">
        <span className={cn(done ? "text-foreground" : "text-muted")}>
          {done ? "Upload complete" : "Uploading…"}
        </span>
        <span className="text-subtle tabular-nums">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
