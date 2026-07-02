"use client";

import { X } from "lucide-react";

/**
 * Editor toaster — reuses the house frosted-notice styling.
 * Announces async Twelve Labs results the moment they land ("Auto-tags ready →
 * Review") without disturbing the metadata the creator is typing. Anchored
 * bottom-right (stacking upward).
 */

export type EditorToast = {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: EditorToast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-0 bottom-0 z-110 flex flex-col items-end gap-2 p-5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="frosted animate-enter pointer-events-auto flex items-center gap-2.5 rounded-control px-4 py-[0.85em] text-small leading-none"
        >
          {/* A quiet status dot — no icon novelty. */}
          <span
            aria-hidden
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground"
          />
          <p className="text-foreground">{t.message}</p>
          {t.actionLabel ? (
            <button
              type="button"
              onClick={() => {
                t.onAction?.();
                onDismiss(t.id);
              }}
              className="border-b border-dotted border-current text-foreground"
            >
              {t.actionLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
            className="ml-1 flex w-6 justify-end text-muted transition hover:text-foreground"
          >
            <X className="h-[0.85em] w-auto" strokeWidth={1.5} />
          </button>
        </div>
      ))}
    </div>
  );
}
