"use client";

import { Plus, X } from "lucide-react";
import type { Credit } from "@/lib/db/schema";
import { Input } from "@/components/ui/input";

/**
 * Cast & crew editor — a small repeatable list of role/name pairs. Kept
 * lightweight (add/remove rows) but structured, because a credit is a pair, not
 * free text: that structure is what lets us later browse "films shot by …".
 */
export function CreditsField({
  value,
  onChange,
}: {
  value: Credit[];
  onChange: (credits: Credit[]) => void;
}) {
  function update(i: number, patch: Partial<Credit>) {
    onChange(value.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...value, { role: "", name: "" }]);
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((credit, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            aria-label="Role"
            value={credit.role}
            placeholder="Role, e.g. Cinematographer"
            onChange={(e) => update(i, { role: e.target.value })}
            className="w-[42%]"
          />
          <Input
            aria-label="Name"
            value={credit.name}
            placeholder="Name"
            onChange={(e) => update(i, { name: e.target.value })}
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="Remove credit"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted transition hover:bg-hover hover:text-foreground"
          >
            <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex w-fit items-center gap-1.5 text-xsmall text-muted transition hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        Add credit
      </button>
    </div>
  );
}
