import type { videos } from "@/lib/db/schema";

/** Publication state of a video (draft | published). */
export type VideoStatus = (typeof videos.status.enumValues)[number];

/**
 * Row + insert types, INFERRED from the Drizzle tables (the source of truth), so
 * they're re-exported here rather than redefined — change a table and the type
 * updates automatically. `New*` are the insert shapes services accept.
 */
export type {
  Clip,
  NewClip,
  NewVideo,
  NewWatchEvent,
  Video,
  WatchEvent,
} from "@/lib/db/schema";
export type { Database } from "@/lib/db/types";
