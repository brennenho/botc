import { describe, expect, it } from "vitest";

import { formatCoverageSummary } from "../../../scripts/summarize-coverage-report.js";

describe("coverage report summary", () => {
  it("formats totals as a compact Markdown table", () => {
    const summary = formatCoverageSummary({
      total: {
        statements: { covered: 868, pct: 36.56, total: 2374 },
        branches: { covered: 553, pct: 27.78, total: 1990 },
        functions: { covered: 251, pct: 33.64, total: 746 },
        lines: { covered: 807, pct: 37.71, total: 2140 },
      },
    });

    expect(summary).toContain("| Statements | 36.56% | 868 / 2,374 |");
    expect(summary).toContain("| Branches | 27.78% | 553 / 1,990 |");
    expect(summary).toContain("| Functions | 33.64% | 251 / 746 |");
    expect(summary).toContain("| Lines | 37.71% | 807 / 2,140 |");
  });

  it("fails clearly when a required metric is absent", () => {
    expect(() =>
      formatCoverageSummary({
        total: {
          statements: { covered: 1, pct: 100, total: 1 },
        },
      }),
    ).toThrow("Coverage summary is missing branches.");
  });
});
