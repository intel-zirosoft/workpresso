import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(currentDirectory, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    setupFiles: ["./src/test/load-env.ts"],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
  },
});
