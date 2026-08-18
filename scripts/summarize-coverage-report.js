import { randomUUID } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** @type {ReadonlyArray<readonly [string, string]>} */
const COVERAGE_METRICS = [
  ["Statements", "statements"],
  ["Branches", "branches"],
  ["Functions", "functions"],
  ["Lines", "lines"],
];

/**
 * @typedef {{ covered: number; pct: number | "Unknown"; total: number }} CoverageMetric
 * @typedef {{ total: Record<string, CoverageMetric> }} CoverageSummary
 */

/**
 * @param {CoverageSummary} report
 */
export function formatCoverageSummary(report) {
  const lines = ["| Metric | Coverage | Covered |", "| --- | ---: | ---: |"];

  for (const [label, key] of COVERAGE_METRICS) {
    const metric = report.total?.[key];
    if (!metric) throw new Error(`Coverage summary is missing ${key}.`);

    const percentage =
      typeof metric.pct === "number" ? `${metric.pct}%` : metric.pct;
    lines.push(
      `| ${label} | ${percentage} | ${formatCount(metric.covered)} / ${formatCount(metric.total)} |`,
    );
  }

  return lines.join("\n");
}

/**
 * @param {number} value
 */
function formatCount(value) {
  return value.toLocaleString("en-US");
}

/**
 * @param {string} reportPath
 */
function summarizeFile(reportPath) {
  if (!existsSync(reportPath)) {
    return "_Coverage totals were unavailable because Vitest did not produce its JSON summary._";
  }

  const report = /** @type {CoverageSummary} */ (
    JSON.parse(readFileSync(reportPath, "utf8"))
  );
  return formatCoverageSummary(report);
}

/**
 * @param {string} summary
 */
function writeGitHubOutputs(summary) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) {
    const delimiter = `COVERAGE_SUMMARY_${randomUUID()}`;
    appendFileSync(
      outputPath,
      `markdown<<${delimiter}\n${summary}\n${delimiter}\n`,
    );
  }

  const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummaryPath) {
    appendFileSync(stepSummaryPath, `## Unit Test Coverage\n\n${summary}\n`);
  }
}

const executablePath = process.argv[1];
if (executablePath && import.meta.url === pathToFileURL(executablePath).href) {
  const summary = summarizeFile(
    process.argv[2] ?? "coverage/coverage-summary.json",
  );
  writeGitHubOutputs(summary);
  console.log(summary);
}
