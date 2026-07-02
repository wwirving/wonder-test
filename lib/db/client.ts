import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Cache the underlying connection across hot reloads (dev) and warm serverless
// invocations (prod) so we don't exhaust the Supabase pooler with a new
// connection on every module evaluation.
const globalForDb = globalThis as unknown as {
  __wonderClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__wonderClient ??
  postgres(connectionString, {
    // REQUIRED for the Supabase transaction pooler (pgBouncer txn mode), which
    // rejects prepared statements. Symptom if missed: `prepared statement "s1"
    // already exists`.
    prepare: false,
    // Keep the per-instance pool tiny — the Supabase pooler does the real
    // connection multiplexing.
    max: 1,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__wonderClient = client;
}

export const db = drizzle(client, { schema, casing: "snake_case" });
export type DB = typeof db;
