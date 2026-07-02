import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    // Migrations use the DIRECT (session) connection — DDL and advisory locks
    // need a session, which the transaction pooler can't reliably hold.
    url: process.env.DIRECT_URL!,
  },
  verbose: true,
  strict: true,
});
