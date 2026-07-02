import type { Video } from "@/lib/db/schema";
import type { VideoAnalytics } from "@/lib/types";

/**
 * Mock data for the `/upload/[id]` editor. Everything here stands in for calls
 * the real build makes — shaped as production types so swapping to live data is
 * mechanical:
 *
 *  - `getDraftVideo(id)` → `getVideo(db, id)` (the draft row created at upload).
 *  - `MOCK_AI_TAGS` / `MOCK_AI_CLIPS` → the Twelve Labs Generate payload that
 *    arrives via a webhook → Supabase Realtime push. In the mock the editor
 *    reveals them on timers so the async "just-in-time" arrival is visible.
 */

/**
 * AI-derived tags from Twelve Labs' Gist + Summary. Deliberately NO title — the
 * creator made the film and knows its name; auto-naming their work is presumptuous.
 * These are curation/discovery signals the creator reviews and applies, plus an
 * optional description draft (a genuine time-saver, unlike a title).
 */
export type AiTagSuggestions = {
  /** Optional AI description draft the creator can adopt as a starting point. */
  synopsis: string;
  genre: string[];
  moodTags: string[];
  tags: string[];
};

/** A suggested highlight/clip — Twelve Labs Summary highlights or search hits. */
export type SuggestedClip = {
  id: string;
  startS: number;
  endS: number;
  label: string;
};

/**
 * A fresh draft as it exists the moment the creator lands here: title seeded
 * AI still `processing`, everything else empty for the creator to fill.
 */
export function getDraftVideo(id: string): Video {
  return {
    id,
    // Empty — the title is the creator's to write. We never infer it from the
    // file name or generate it; they know what their film is called.
    title: "",
    synopsis: null,
    director: null,
    credits: [],
    genre: [],
    moodTags: [],
    tags: [],
    runtimeSeconds: 212,
    posterUrl: null,
    accessTier: "public",
    storagePath: "/video/mock.mp4",
    status: "draft",
    aiTagsStatus: "processing",
    aiClipsStatus: "processing",
    createdAt: new Date(),
  };
}

export const MOCK_AI_TAGS: AiTagSuggestions = {
  synopsis:
    "Two former lovers cross paths on a rain-slicked platform years after a quiet goodbye. A wordless short about the distance time puts between people, and the moment it briefly collapses.",
  genre: ["Drama", "Romance"],
  moodTags: ["Wistful", "Tender", "Nocturnal"],
  tags: ["Short film", "16mm", "Reunion"],
};

export const MOCK_AI_CLIPS: SuggestedClip[] = [
  { id: "c1", startS: 8, endS: 24, label: "Rain on the platform" },
  { id: "c2", startS: 74, endS: 91, label: "The recognition" },
  { id: "c3", startS: 152, endS: 170, label: "Last goodbye" },
];

/** How long the (mocked) Twelve Labs indexing takes to stream each surface in. */
export const AI_TAGS_DELAY_MS = 4200;
export const AI_CLIPS_DELAY_MS = 8400;

/**
 * Stand-in engagement roll-up — the shape `getVideoAnalytics(db, id)` returns.
 * Represents an established published video (the dashboard-drill-in case). A
 * fresh publish would start at zero and grow as `watch_events` accumulate.
 */
export const MOCK_ANALYTICS: VideoAnalytics = {
  videoId: "",
  views: 1287,
  meanPctWatched: 0.62,
  meanSecondsPlayed: 131,
  completionRate: 0.41,
};
