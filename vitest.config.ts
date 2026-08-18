import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    exclude: [...configDefaults.exclude, "integration/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/__tests__/**",
        "src/app/**/page.tsx",
        "src/app/**/layout.tsx",
        "src/app/**/loading.tsx",
        "src/app/**/error.tsx",
        "src/app/**/not-found.tsx",
      ],
      thresholds: {
        statements: 35,
        branches: 25,
        functions: 30,
        lines: 35,
        "src/lib/game-state/**": {
          statements: 75,
          branches: 65,
          functions: 75,
          lines: 80,
        },
        "src/hooks/use-storyteller-game.ts": {
          statements: 75,
          branches: 55,
          functions: 55,
          lines: 75,
        },
      },
    },
  },
});
