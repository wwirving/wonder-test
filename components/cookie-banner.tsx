"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "wonder-test:cookies-dismissed";

/** Frosted bottom-right cookie notice (source: `#cookiesWrap .message`). */
export function CookieBanner() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }

  return (
    <div className="pointer-events-none fixed right-0 bottom-0 z-110 p-5">
      <div
        className={cn(
          "frosted pointer-events-auto flex items-center rounded-control px-4 py-[0.85em] text-small leading-none text-subtle transition-all duration-200",
          show
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        )}
      >
        <p>
          <span>This site uses cookies. </span>
          <a
            href="#"
            className="border-b border-dotted border-current opacity-85"
          >
            Learn more
          </a>
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="ml-1 flex w-8 cursor-pointer justify-end text-right"
        >
          <X className="h-[0.85em] w-auto text-muted" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
