import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
  // Resolves the `@/*` path alias from tsconfig.json inside tests (native to Vite).
  resolve: {
    tsconfigPaths: true,
  },
});
