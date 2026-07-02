"use client";

import * as tus from "tus-js-client";
import { BUCKET } from "./paths";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

interface UploadArgs {
  path: string;
  contentType: string;
  onProgress: (percent: number) => void;
}

/** A running upload: `done` settles on success/failure; `abort` cancels it. */
export interface UploadHandle {
  done: Promise<void>;
  abort: () => void;
}

/**
 * Resumable, direct-to-Storage upload via TUS — the only Supabase path that
 * reports byte progress and survives flaky connections. Auth is the anon
 * publishable key; the `videos` bucket's RLS lets `anon` insert.
 */
export function uploadVideo(file: File, args: UploadArgs): UploadHandle {
  if (!SUPABASE_URL || !PUBLISHABLE_KEY) {
    throw new Error("Supabase env not configured for uploads");
  }

  let upload: tus.Upload;
  let rejectDone: (reason: unknown) => void = () => {};
  const done = new Promise<void>((resolve, reject) => {
    rejectDone = reject;
    upload = new tus.Upload(file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      headers: {
        authorization: `Bearer ${PUBLISHABLE_KEY}`,
        apikey: PUBLISHABLE_KEY,
        "x-upsert": "true",
      },
      chunkSize: 6 * 1024 * 1024, // required exactly by Supabase's TUS endpoint
      metadata: {
        bucketName: BUCKET,
        objectName: args.path,
        contentType: args.contentType,
        cacheControl: "3600",
      },
      removeFingerprintOnSuccess: true,
      onProgress: (sent, total) =>
        args.onProgress(total > 0 ? Math.round((sent / total) * 100) : 0),
      onError: (err) => reject(friendlyError(err)),
      onSuccess: () => resolve(),
    });
    upload.start();
  });

  // tus's abort() doesn't settle `done`, so reject it here to unblock awaiters.
  return {
    done,
    abort: () => {
      void upload?.abort(true);
      rejectDone(new DOMException("Upload aborted", "AbortError"));
    },
  };
}

function friendlyError(err: unknown): Error {
  const status =
    err instanceof tus.DetailedError ? err.originalResponse?.getStatus() : undefined;
  return status === 413
    ? new Error("This video is larger than the storage limit.")
    : new Error("Upload failed — check your connection and try again.");
}
