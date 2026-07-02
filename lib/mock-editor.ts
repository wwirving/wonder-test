/**
 * The one remaining mock in the upload flow: the Twelve Labs enrichment.
 *
 *  - `MOCK_AI_TAGS` / `MOCK_AI_CLIPS` → the Twelve Labs Generate payload that
 *    would arrive via a webhook → Supabase Realtime push. The editor reveals
 *    them on timers so the async "just-in-time" arrival is visible.
 *
 * Everything else (draft row, metadata save, publish, analytics) now reads and
 * writes the real database.
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
