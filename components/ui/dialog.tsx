"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Minimal modal dialog in the shadcn compositional shape (Dialog · Trigger ·
 * Content · Header · Title · Description), hand-rolled onto the Wonder tokens —
 * no Radix. The app only needs one lightweight, accessible overlay, so this
 * stays small on purpose while still covering the essentials: a portal, a
 * frosted scrim, Escape / click-outside to close, focus move-in + restore, a
 * Tab focus trap, and a body scroll-lock while open.
 *
 * Controlled or uncontrolled: pass `open`/`onOpenChange` to drive it, or let it
 * own its state and open it from a `<DialogTrigger>`.
 */

type DialogCtx = {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descId: string;
};
const Ctx = React.createContext<DialogCtx | null>(null);

function useDialog(): DialogCtx {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("Dialog.* must be used inside <Dialog>");
  return ctx;
}

export function Dialog({
  open: openProp,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [uncontrolled, setUncontrolled] = React.useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolled;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  // Stable ids so Title/Description can wire aria-labelledby / -describedby.
  const uid = React.useId();
  const ctx = React.useMemo(
    () => ({ open, setOpen, titleId: `${uid}-title`, descId: `${uid}-desc` }),
    [open, setOpen, uid],
  );

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

/** Wraps a single element and opens the dialog on click (keeps its own onClick). */
export function DialogTrigger({
  children,
}: {
  children: React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>;
}) {
  const { setOpen } = useDialog();
  const childOnClick = children.props.onClick;
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      childOnClick?.(e);
      if (!e.defaultPrevented) setOpen(true);
    },
  });
}

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { open, setOpen, titleId, descId } = useDialog();
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Portal only after mount — document.body isn't available during SSR.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Remember what was focused before opening so we can hand focus back on close.
  const restoreRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;

    // Lock the background from scrolling behind the scrim.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the panel (the close button, or the panel itself).
    const focusFirst = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const target = panel.querySelector<HTMLElement>(
        "[data-autofocus], button, [href], input, textarea, [tabindex]:not([tabindex='-1'])",
      );
      (target ?? panel).focus();
    };
    // Defer a frame so the portal node is in the DOM before we focus it.
    const raf = requestAnimationFrame(focusFirst);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      // Trap Tab within the panel's focusable elements.
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open, setOpen]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      {/* Frosted scrim — neutral black in both themes (the --overlay token
          inverts to white in dark, so we don't use it here). */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className={cn(
          "animate-enter relative w-full max-w-[26rem] rounded-card bg-surface p-[var(--margin-sm)] shadow-project outline-none",
          className,
        )}
      >
        <DialogClose
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-input hover:text-foreground active:not-disabled:scale-[0.96]"
          aria-label="Close"
        >
          <X className="size-4" />
        </DialogClose>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function DialogHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("mb-[var(--margin-sm)]", className)}>{children}</div>;
}

export function DialogTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { titleId } = useDialog();
  return (
    <h2 id={titleId} className={cn("text-medium text-foreground", className)}>
      {children}
    </h2>
  );
}

export function DialogDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { descId } = useDialog();
  return (
    <p id={descId} className={cn("mt-2 text-small text-subtle", className)}>
      {children}
    </p>
  );
}

/** Closes the dialog on click. Renders a bare button so callers own the styling. */
export function DialogClose({
  className,
  children,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialog();
  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
