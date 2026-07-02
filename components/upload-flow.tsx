"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";
import { probeDuration } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { FileCard } from "@/components/upload-file-card";
import { uploadVideo, type UploadHandle } from "@/lib/storage/upload-video";
import {
  ACCEPTED_VIDEO_TYPES,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
} from "@/lib/storage/paths";
import type { UploadRequest, UploadResponse } from "@/lib/types";

const ACCEPT = ACCEPTED_VIDEO_TYPES.join(",");
const HINT = `MP4, MOV or WebM · up to ${MAX_UPLOAD_LABEL}`;

type Phase = "idle" | "uploading" | "done";

/**
 * The upload page's interactive core: pick a file → draft row via `/api/uploads`
 * → stream straight to Storage (resumable TUS, real byte progress) → hand off to
 * `/upload/[id]` for metadata + publish. The video never touches our server.
 */
export function UploadFlow() {
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [file, setFile] = React.useState<File | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [videoId, setVideoId] = React.useState<string | null>(null);
  const upload = React.useRef<UploadHandle | null>(null);

  const cancel = React.useCallback(() => {
    upload.current?.abort();
    upload.current = null;
  }, []);

  // Abort any in-flight upload if the component unmounts mid-transfer.
  React.useEffect(() => cancel, [cancel]);

  function reset() {
    cancel();
    setPhase("idle");
    setFile(null);
    setProgress(0);
    setVideoId(null);
  }

  async function start(picked: File) {
    setError(null);
    setFile(picked);
    setProgress(0);
    setPhase("uploading");

    try {
      // Runtime comes free from the file — probe it in-browser (see probeDuration).
      const request: UploadRequest = {
        filename: picked.name,
        contentType: picked.type,
        runtimeSeconds: await probeDuration(picked),
      };

      // Open a draft row + reserve the Storage path; bytes go direct, not here.
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!res.ok) throw new Error(`Couldn’t start the upload (${res.status}).`);
      const { videoId: id, path } = (await res.json()) as UploadResponse;

      const handle = uploadVideo(picked, {
        path,
        contentType: picked.type || "video/mp4",
        onProgress: setProgress,
      });
      upload.current = handle;
      await handle.done;
      upload.current = null;

      setProgress(100);
      setVideoId(id);
      setPhase("done");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(
        err instanceof Error ? err.message : "Something went wrong during upload.",
      );
      reset();
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {phase === "idle" ? (
        <FileUpload
          accept={ACCEPT}
          maxSize={MAX_UPLOAD_BYTES}
          hint={HINT}
          onSelect={start}
          onError={setError}
        />
      ) : (
        <FileCard
          file={file!}
          progress={progress}
          done={phase === "done"}
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
