import type { Metadata } from "next";
import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { UploadFlow } from "@/components/upload-flow";

export const metadata: Metadata = {
  title: "Upload",
};

// Upload → Details → Publish. Shown up-front (Vimeo/MUBI style) so the creator
// knows this screen is just the first of three steps. Static for now; the
// editor route will own steps 2–3.
const STEPS = ["Upload", "Details", "Publish"] as const;

function Steps() {
  return (
    <ol className="flex items-center justify-center gap-3 text-xsmall select-none">
      {STEPS.map((label, i) => (
        <Fragment key={label}>
          {i > 0 && <span className="h-px w-6 bg-[var(--input-strong)]" />}
          <li
            className={cn(
              "flex items-center gap-1.5",
              i === 0 ? "text-foreground" : "text-muted"
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] leading-none",
                i === 0 ? "bg-foreground text-background" : "bg-input text-muted"
              )}
            >
              {i + 1}
            </span>
            {label}
          </li>
        </Fragment>
      ))}
    </ol>
  );
}

/**
 * Upload entry point — the ingest moment only. A client dropzone starts the
 * (mocked) upload, then routes to /upload/[id] for metadata, poster, AI
 * suggestions, and publish. Static shell stays on the server; only the
 * interactive flow ships to the client.
 */
export default function UploadPage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-5 pt-[var(--margin-main-top)] pb-[var(--margin-md)]">
      {/* Enter is split into semantic chunks and staggered ~80ms apart, rather
          than fading the whole container as one block. */}
      <div className="w-full max-w-[560px]">
        <div className="animate-enter">
          <Steps />
        </div>

        <header className="mt-[var(--margin-sm2)] text-center">
          <h1 className="animate-enter text-balance text-medium text-foreground [animation-delay:80ms]">
            Upload a film
          </h1>
          <p className="animate-enter mx-auto mt-2 max-w-[26rem] text-pretty text-small text-muted [animation-delay:160ms]">
            Drop your video to start a draft. You&apos;ll add details and publish
            on the next step, while we analyse the video and surface suggestions
            when it&apos;s ready.
          </p>
        </header>

        <div className="animate-enter mt-[var(--margin-sm2)] [animation-delay:240ms]">
          <UploadFlow />
        </div>
      </div>
    </main>
  );
}
