"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { blurImageFor } from "@/lib/avatar";
import { Button } from "@/components/ui/button";
import { FileUpload, formatBytes } from "@/components/ui/file-upload";

const ACCEPT = "video/mp4,video/quicktime,video/webm";
const MAX_SIZE = 2 * 1024 ** 3; // 2 GB
const HINT = "MP4, MOV or WebM · up to 2 GB";

type Phase = "idle" | "uploading" | "done";

/**
 * The upload page's interactive core — the only client bundle on the route.
 *
 * Ingest-only by design (Vimeo/MUBI flow): pick a file → validate → show
 * progress → hand off to `/upload/[id]` where metadata, the poster grab, and
 * AI tag/clip suggestions live. The upload is mocked here; the two commented
 * seams are where the real signed upload (browser → Supabase Storage) and the
 * `createVideo` draft insert will slot in without changing this UI.
 */
export function UploadFlow() {
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [file, setFile] = React.useState<File | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [videoId, setVideoId] = React.useState<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = React.useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  React.useEffect(() => stop, [stop]);

  function reset() {
    stop();
    setPhase("idle");
    setFile(null);
    setProgress(0);
    setVideoId(null);
  }

  function start(picked: File) {
    setError(null);
    setFile(picked);
    setProgress(0);
    setPhase("uploading");

    // MOCK: a real build starts a resumable signed upload here and drives
    // `progress` from its byte callbacks instead of this interval.
    stop();
    timer.current = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 7);
        if (next >= 100) {
          stop();
          // MOCK: the draft `videos` row (created alongside the upload) supplies
          // this id; we route to its editor to continue.
          setVideoId(crypto.randomUUID());
          setPhase("done");
        }
        return next;
      });
    }, 120);
  }

  return (
    <div className="flex flex-col gap-8">
      {phase === "idle" ? (
        <FileUpload
          accept={ACCEPT}
          maxSize={MAX_SIZE}
          hint={HINT}
          onSelect={start}
          onError={setError}
        />
      ) : (
        <FileCard
          file={file!}
          phase={phase}
          progress={progress}
          onCancel={reset}
        />
      )}

      {error ? (
        <p className="animate-enter flex items-center justify-center gap-1.5 text-xsmall text-subtle">
          <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
          {error}
        </p>
      ) : null}

      {phase === "done" && videoId ? (
        <div className="animate-enter flex items-center justify-center gap-3">
          <Button variant="ghost" size="sm" onClick={reset}>
            Replace file
          </Button>
          {/* Optical alignment: trailing icon gets 2px less padding than the
              text side so the button doesn't read as right-heavy. */}
          <Button className="pr-3.5" onClick={() => router.push(`/upload/${videoId}`)}>
            Add details
            <ArrowRight className="h-[0.9em] w-[0.9em]" strokeWidth={1.75} />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** Selected-file row with progress — shared by the uploading and done phases. */
function FileCard({
  file,
  phase,
  progress,
  onCancel,
}: {
  file: File;
  phase: Phase;
  progress: number;
  onCancel: () => void;
}) {
  const done = phase === "done";

  return (
    <div className="animate-enter rounded-card bg-surface p-4 shadow-border">
      <div className="flex items-center gap-3">
        {/* Blurred stand-in thumbnail (the soft-gradient avatar trick from
            Discover), seeded by the file name until a real poster is grabbed. */}
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
            // Visible 32px control, but the pseudo-element extends the tap
            // target to 40×40 (min hit area) without shifting layout.
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
