import { defineConfig, devices } from "@playwright/test";

const integrationPort = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = `http://localhost:${integrationPort}`;

export default defineConfig({
  testDir: "./integration",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 45_000,
  expect: {
    timeout: 5_000,
  },
  reporter: process.env.CI
    ? [
        ["line"],
        ["html", { open: "never", outputFolder: "integration-report" }],
        ["json", { outputFile: "integration-results.json" }],
      ]
    : [
        ["list"],
        ["html", { open: "never", outputFolder: "integration-report" }],
      ],
  outputDir: "integration-test-results",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "tablet-landscape",
      grep: /@smoke/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 844, height: 390 },
      },
    },
    {
      name: "mobile-webkit",
      grep: /@smoke/,
      use: {
        ...devices["iPhone 13"],
        browserName: "webkit",
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: process.env.CI
      ? `pnpm exec next start --hostname localhost --port ${integrationPort}`
      : `pnpm exec next dev --turbo --hostname localhost --port ${integrationPort}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
