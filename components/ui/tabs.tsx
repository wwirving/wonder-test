"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal controlled tabs in the shadcn/dice-ui shape (Tabs · List · Trigger ·
 * Content), restyled onto the Wonder tokens: an underline strip, monochrome,
 * single weight. Purpose-built for the upload editor, where each trigger doubles
 * as an async status surface — `TabsTrigger` takes an `adornment` slot (a dot,
 * spinner, or count) so a tab can advertise that AI enrichment has landed
 * without the creator leaving the tab they're on.
 */

type TabsCtx = { value: string; setValue: (v: string) => void };
const Ctx = React.createContext<TabsCtx | null>(null);

function useTabs(): TabsCtx {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("Tabs.* must be used inside <Tabs>");
  return ctx;
}

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useMemo(
    () => ({ value, setValue: onValueChange }),
    [value, onValueChange],
  );
  return (
    <Ctx.Provider value={ctx}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  );
}

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-5 border-b border-[var(--input-strong)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  adornment,
  className,
}: {
  value: string;
  children: React.ReactNode;
  /** Status slot rendered after the label — dot, spinner, or count badge. */
  adornment?: React.ReactNode;
  className?: string;
}) {
  const { value: active, setValue } = useTabs();
  const selected = active === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={() => setValue(value)}
      className={cn(
        "group relative -mb-px inline-flex items-center gap-1.5 pb-3 pt-1 text-small outline-none transition-colors",
        selected ? "text-foreground" : "text-muted hover:text-foreground",
        className,
      )}
    >
      {children}
      {adornment}
      {/* Active underline sits on the list's bottom border. Fades rather than
          slides — no layout measurement, and it reads as calm not flashy. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 bottom-0 h-px bg-foreground transition-opacity",
          selected ? "opacity-100" : "opacity-0",
        )}
      />
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { value: active } = useTabs();
  if (active !== value) return null;
  return (
    <div role="tabpanel" className={cn("animate-enter", className)}>
      {children}
    </div>
  );
}
