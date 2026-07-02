"use client";

import { AlertCircle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Video } from "@/lib/db/schema";

/** The Twelve Labs webhook lifecycle, shared by tags and clips. */
export type AiStatus = Video["aiTagsStatus"]; // pending | processing | ready | failed

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-3 w-3 animate-spin", className)}
      strokeWidth={1.75}
      aria-hidden
    />
  );
}

/** Solid "something new landed here" dot for a tab trigger. */
export function NewDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("h-1.5 w-1.5 rounded-full bg-foreground", className)}
    />
  );
}

/** Small count pill for a tab trigger (e.g. number of suggested clips). */
export function CountBadge({
  count,
  muted,
}: {
  count: number;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none tabular-nums",
        muted ? "bg-input text-muted" : "bg-foreground text-background",
      )}
    >
      {count}
    </span>
  );
}

/** A labelled status line (used in the rail's enrichment summary). */
export function AiStatusLine({
  label,
  status,
}: {
  label: string;
  status: AiStatus;
}) {
  const view = {
    pending: { icon: <Spinner />, text: "Queued", tone: "text-muted" },
    processing: { icon: <Spinner />, text: "Analyzing…", tone: "text-subtle" },
    ready: {
      icon: <Check className="h-3 w-3" strokeWidth={2} aria-hidden />,
      text: "Ready",
      tone: "text-foreground",
    },
    failed: {
      icon: <AlertCircle className="h-3 w-3" strokeWidth={1.75} aria-hidden />,
      text: "Unavailable",
      tone: "text-muted",
    },
  }[status];

  return (
    <div className="flex items-center justify-between text-xsmall">
      <span className="text-muted">{label}</span>
      <span className={cn("inline-flex items-center gap-1.5", view.tone)}>
        {view.icon}
        {view.text}
      </span>
    </div>
  );
}
