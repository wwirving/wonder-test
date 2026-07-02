/**
 * Shared shapes for the Twelve Labs enrichment surfaces the editor consumes.
 * These are the parsed outputs of the `/analyze` structured-response calls
 * (see `lib/services/twelve-labs.ts`) — the durable contract between the
 * indexing reconciler and the UI.
 */

/**
 * AI-derived tags from a single `/analyze` call. Deliberately NO title — the
 * creator made the film and knows its name; auto-naming their work is
 * presumptuous. Also NO genre — that's a closed vocabulary the creator picks
 * from a fixed list in Details, so free-form AI genres would only conflict.
 * These are the open-vocabulary curation signals the AI is actually useful for
 * (mood/themes + tags), plus an optional description draft.
 */
export type AiTagSuggestions = {
  /** Optional AI description draft the creator can adopt as a starting point. */
  synopsis: string;
  moodTags: string[];
  tags: string[];
};

/** A suggested highlight/clip — a shareable moment surfaced by `/analyze`. */
export type SuggestedClip = {
  id: string;
  startS: number;
  endS: number;
  label: string;
  /** Still frame from the clip's start (generated + stored after indexing). */
  posterUrl?: string | null;
};
