"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Primary nav — the row of section links that sits under the "Wonder TV" logo.
 * Client-side only because it reads `usePathname()` to mark the active route;
 * everything it links to is a Server Component page.
 */
const ITEMS = [
  { href: "/", label: "Discover" },
  { href: "/upload", label: "Upload" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

export function Nav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn("pointer-events-auto flex items-center gap-4", className)}
    >
      {ITEMS.map(({ href, label }) => {
        // Exact match for the home route; prefix match elsewhere so a child
        // like /upload/[id] still marks its parent "Upload" active.
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "transition-colors",
              active ? "text-foreground" : "text-muted hover:text-foreground"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
