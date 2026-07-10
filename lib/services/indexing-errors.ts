/**
 * Classify a Twelve Labs kickoff failure as permanent (the video itself is
 * un-indexable — retrying can never succeed) or transient (network, rate limit,
 * TL outage — a later trigger should retry).
 *
 * Lives outside `@/lib/services/twelve-labs` on purpose: tests mock that module
 * wholesale, but still exercise this classifier with real SDK errors.
 */
import { TwelvelabsApiError } from "twelvelabs-js";

// Friendly copy for the rejection codes creators can actually act on. Anything
// unmapped falls back to TL's own message (single-line and already readable).
const KNOWN_REASONS: Record<string, string> = {
  video_resolution_too_low:
    "The video's resolution is too low for AI analysis — the minimum is 360×360.",
  video_resolution_too_high:
    "The video's resolution is too high for AI analysis — the maximum is 4K (5184×2160).",
  video_duration_too_short:
    "The video is too short for AI analysis.",
  video_duration_too_long:
    "The video is too long for AI analysis.",
  video_file_broken:
    "The video file could not be read — it may be corrupt or use an unsupported codec.",
};

export type IndexingErrorClass = { permanent: boolean; reason: string };

const FALLBACK_REASON = "Twelve Labs could not index this video.";

/** `body` is typed `unknown` by the SDK — a `{code, message}` object for API
 *  rejections, but possibly a raw string for non-JSON responses. */
function extractReason(body: unknown): string {
  if (typeof body === "string" && body.trim()) return body.trim();
  if (body && typeof body === "object") {
    const { code, message } = body as { code?: unknown; message?: unknown };
    if (typeof code === "string" && KNOWN_REASONS[code]) {
      return KNOWN_REASONS[code];
    }
    if (typeof message === "string" && message.trim()) return message.trim();
    if (typeof code === "string" && code.trim()) return code.trim();
  }
  return FALLBACK_REASON;
}

export function classifyIndexingError(err: unknown): IndexingErrorClass {
  // Only a definite 4xx API verdict is permanent. The SDK also throws
  // TwelvelabsApiError with NO statusCode for network/unknown failures, so an
  // undefined statusCode must stay transient. 408/429 are retryable by nature.
  const permanent =
    err instanceof TwelvelabsApiError &&
    typeof err.statusCode === "number" &&
    err.statusCode >= 400 &&
    err.statusCode < 500 &&
    err.statusCode !== 408 &&
    err.statusCode !== 429;

  return {
    permanent,
    reason: permanent
      ? extractReason((err as TwelvelabsApiError).body)
      : FALLBACK_REASON,
  };
}
