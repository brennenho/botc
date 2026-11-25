import { defineConfig, devices } from "@playwright/test";

const integrationPort = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const isCI = Boolean(process.env.CI);
const baseURL = `${isCI ? "https" : "http"}://localhost:${integrationPort}`;

export default defineConfig({
  testDir: "./integration",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  timeout: 45_000,
  expect: {
    timeout: 5_000,
  },
  reporter: isCI
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
    contextOptions: { ignoreHTTPSErrors: isCI },
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
      name: "ipad-landscape",
      grep: /@ipad/,
      use: {
        browserName: "webkit",
        viewport: { width: 1024, height: 768 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
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
    command: isCI
      ? "node scripts/start-integration-server.mjs"
      : `pnpm exec next dev --turbo --hostname localhost --port ${integrationPort}`,
    env: isCI ? { NODE_ENV: "production" } : undefined,
    url: baseURL,
    ignoreHTTPSErrors: isCI,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
