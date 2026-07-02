/**
 * Fixed genre vocabulary. Genre is a *closed* list (unlike mood/tags, which are
 * open text[]): it powers browse/filter facets, so a controlled set keeps the
 * catalogue coherent. Genre is creator-only — chosen from this list in Details.
 * Twelve Labs enrichment deliberately does NOT suggest genres (its free-form
 * output would conflict with this vocabulary); it suggests mood/themes + tags.
 */
export const GENRES = [
  "Drama",
  "Documentary",
  "Comedy",
  "Thriller",
  "Sci-Fi",
  "Horror",
  "Animation",
  "Music",
  "Experimental",
  "Action",
  "Romance",
  "Fantasy",
] as const;

export type Genre = (typeof GENRES)[number];
