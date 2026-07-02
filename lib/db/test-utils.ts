import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";
import type { Database } from "./types";

/**
 * Spin up a fresh in-memory Postgres (PGlite = real Postgres compiled to WASM)
 * and apply the committed Drizzle migrations, so tests exercise the exact DDL
 * production runs — generated columns, CHECK constraints, enums and all.
 *
 * Each call is an isolated instance; use one per test file and `close()` it in
 * `afterEach`/`afterAll`.
 */
export async function makeTestDb(): Promise<{ db: Database; client: PGlite }> {
  const client = new PGlite();
  const db = drizzle(client, { schema, casing: "snake_case" });
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  return { db, client };
}
