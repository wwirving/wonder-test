import type { PgDatabase } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

/**
 * The shared database type every service function accepts as its first argument.
 *
 * It is satisfied by both the production postgres-js client (`lib/db/client.ts`)
 * and the in-memory PGlite client used in tests (`lib/db/test-utils.ts`), so
 * services stay pure and DB-agnostic. The query-result HKT is left open (`any`)
 * because it differs per driver; the schema is what the services actually rely on.
 */
export type Database = PgDatabase<any, typeof schema>;
