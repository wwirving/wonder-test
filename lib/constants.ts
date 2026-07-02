/**
 * Fixed genre vocabulary. Genre is a *closed* list (unlike mood/tags, which are
 * open text[]): it powers browse/filter facets, so a controlled set keeps the
 * catalogue coherent. Twelve Labs' topic/hashtag output is mapped back onto
 * this list when it suggests genres.
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
