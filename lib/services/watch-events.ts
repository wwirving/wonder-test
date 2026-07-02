import {
  watchEvents,
  type NewWatchEvent,
  type WatchEvent,
} from "@/lib/db/schema";
import type { Database } from "@/lib/types";

/**
 * Persist a throttled progress ping from the player. `pct_watched` is a
 * DB-generated column, so it is computed on insert — never passed in.
 */
export async function recordWatchEvent(
  db: Database,
  input: NewWatchEvent,
): Promise<WatchEvent> {
  const [row] = await db.insert(watchEvents).values(input).returning();
  return row;
}
