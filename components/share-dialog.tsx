"use client";

import * as React from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/* ---- brand marks --------------------------------------------------------- */
/* Solid, single-colour glyphs (currentColor) so they inherit the monochrome
   design tokens like every other icon in the system, rather than pulling in
   coloured brand logos. 24×24 viewBox, matching lucide's grid. */

type Glyph = ({ className }: { className?: string }) => React.JSX.Element;

const XMark: Glyph = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookMark: Glyph = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const WhatsAppMark: Glyph = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const LinkedInMark: Glyph = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const EnvelopeMark: Glyph = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M1.5 4.5A1.5 1.5 0 000 6v.383l12 6.6 12-6.6V6a1.5 1.5 0 00-1.5-1.5h-21zM24 8.664l-11.567 6.362a.75.75 0 01-.866 0L0 8.664V18a1.5 1.5 0 001.5 1.5h21A1.5 1.5 0 0024 18V8.664z" />
  </svg>
);

/* ---- share targets ------------------------------------------------------- */

function shareTargets(url: string, title: string) {
  const u = encodeURIComponent(url);
  const text = encodeURIComponent(`Watch “${title}” on Wonder`);
  return [
    { name: "X", Icon: XMark, href: `https://twitter.com/intent/tweet?url=${u}&text=${text}` },
    { name: "Facebook", Icon: FacebookMark, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: "WhatsApp", Icon: WhatsAppMark, href: `https://wa.me/?text=${text}%20${u}` },
    { name: "LinkedIn", Icon: LinkedInMark, href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { name: "Email", Icon: EnvelopeMark, href: `mailto:?subject=${text}&body=${u}` },
  ];
}

/**
 * Share sheet for the watch page. A circular icon trigger opens a compact
 * dialog with the obvious socials (each a circular monochrome button) plus a
 * copy-link row. The absolute URL is resolved from `window.location` on the
 * client so it works across preview / prod origins without a config env var.
 */
export function ShareDialog({ title, path }: { title: string; path: string }) {
  const [url, setUrl] = React.useState(path);
  React.useEffect(() => {
    setUrl(new URL(path, window.location.origin).toString());
  }, [path]);

  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context / denied) — leave the URL visible
      // for a manual copy rather than surfacing an error.
    }
  };

  const targets = shareTargets(url, title);

  return (
    <Dialog>
      <DialogTrigger>
        <button
          type="button"
          aria-label="Share"
          title="Share"
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-input text-foreground transition hover:bg-input-strong active:not-disabled:scale-[0.96]"
        >
          <Share2 className="size-4" />
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
          <DialogDescription className="line-clamp-1">{title}</DialogDescription>
        </DialogHeader>

        {/* Socials — circular, monochrome, with a small caption for clarity. */}
        <div className="flex flex-wrap justify-between gap-2">
          {targets.map(({ name, Icon, href }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share on ${name}`}
              className="group flex flex-1 basis-14 flex-col items-center gap-2"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-input text-foreground transition group-hover:bg-input-strong group-active:scale-[0.96]">
                <Icon className="size-5" />
              </span>
              <span className="text-xsmall text-muted transition group-hover:text-foreground">
                {name}
              </span>
            </a>
          ))}
        </div>

        {/* Copy link */}
        <div className="mt-[var(--margin-sm)] flex items-center gap-2 rounded-control bg-input p-1 pl-3">
          <span className="flex-1 truncate text-small text-subtle select-all">{url}</span>
          <button
            type="button"
            onClick={copy}
            className={cn(
              "flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-control bg-foreground px-3 text-small leading-none text-background transition hover:opacity-85 active:not-disabled:scale-[0.96]",
            )}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
