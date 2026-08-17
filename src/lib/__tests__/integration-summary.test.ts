import type { JSONReport } from "@playwright/test/reporter";
import { describe, expect, it } from "vitest";

import {
  formatDuration,
  formatIntegrationSummary,
} from "../../../scripts/summarize-integration-report.js";

function reportWithTests(
  tests: Array<{
    error?: string;
    projectName?: string;
    status: "expected" | "flaky" | "skipped" | "unexpected";
    title: string;
  }>,
) {
  return {
    errors: [],
    stats: {
      duration: 11_720,
      expected: tests.filter((test) => test.status === "expected").length,
      flaky: tests.filter((test) => test.status === "flaky").length,
      skipped: tests.filter((test) => test.status === "skipped").length,
      startTime: "2026-08-17T00:00:00.000Z",
      unexpected: tests.filter((test) => test.status === "unexpected").length,
    },
    suites: [
      {
        specs: tests.map((test, index) => ({
          file: "integration/multiplayer.spec.ts",
          line: index + 10,
          tests: [
            {
              projectName: test.projectName ?? "chromium",
              results: [
                {
                  error: test.error ? { message: test.error } : undefined,
                  errors: [],
                },
              ],
              status: test.status,
            },
          ],
          title: test.title,
        })),
        suites: [],
      },
    ],
  } as unknown as JSONReport;
}

describe("integration report summary", () => {
  it("formats the result totals and duration", () => {
    const summary = formatIntegrationSummary(
      reportWithTests([
        { status: "expected", title: "realtime update" },
        { status: "expected", title: "authorization boundary" },
        { status: "skipped", title: "future scenario" },
      ]),
    );

    expect(summary).toContain("| 2 | 0 | 0 | 1 | 11.7 s |");
    expect(summary).not.toContain("### Failed tests");
  });

  it("includes actionable failed and flaky test details", () => {
    const summary = formatIntegrationSummary(
      reportWithTests([
        {
          error: "Error: expected player snapshot to update\nstack trace",
          status: "unexpected",
          title: "storyteller changes reach a connected player",
        },
        {
          status: "flaky",
          title: "focus reconciliation recovers an update",
        },
      ]),
    );

    expect(summary).toContain("### Failed tests");
    expect(summary).toContain("storyteller changes reach a connected player");
    expect(summary).toContain("Error: expected player snapshot to update");
    expect(summary).toContain("### Flaky tests");
    expect(summary).toContain("focus reconciliation recovers an update");
  });

  it("formats sub-second and minute durations", () => {
    expect(formatDuration(480)).toBe("480 ms");
    expect(formatDuration(61_400)).toBe("1m 1s");
  });
});
