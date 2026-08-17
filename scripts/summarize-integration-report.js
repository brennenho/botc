import { randomUUID } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { stripVTControlCharacters } from "node:util";

/** @typedef {import("@playwright/test/reporter").JSONReport} JSONReport */
/** @typedef {import("@playwright/test/reporter").JSONReportSpec} JSONReportSpec */
/** @typedef {import("@playwright/test/reporter").JSONReportSuite} JSONReportSuite */
/** @typedef {import("@playwright/test/reporter").JSONReportTest} JSONReportTest */

const MAX_LISTED_TESTS = 5;

/**
 * @param {number} milliseconds
 */
export function formatDuration(milliseconds) {
  if (milliseconds < 1_000) return `${Math.round(milliseconds)} ms`;

  const seconds = milliseconds / 1_000;
  if (seconds < 60) return `${seconds.toFixed(1).replace(/\.0$/, "")} s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * @param {JSONReport} report
 */
export function formatIntegrationSummary(report) {
  const { duration, expected, flaky, skipped, unexpected } = report.stats;
  const specs = collectSpecs(report.suites);
  const failures = collectTests(specs, "unexpected");
  const flakyTests = collectTests(specs, "flaky");
  const runErrors = report.errors
    .map((error) => firstErrorLine(error.message ?? error.stack))
    .filter((message) => message.length > 0);
  const lines = [
    "| Passed | Failed | Flaky | Skipped | Duration |",
    "| ---: | ---: | ---: | ---: | ---: |",
    `| ${expected} | ${unexpected} | ${flaky} | ${skipped} | ${formatDuration(duration)} |`,
  ];

  appendTestDetails(lines, "Failed Tests", failures, true);
  appendTestDetails(lines, "Flaky Tests", flakyTests, false);

  if (runErrors.length > 0) {
    lines.push("", "### Run Errors");
    for (const message of runErrors.slice(0, MAX_LISTED_TESTS)) {
      lines.push(`- ${escapeMarkdown(message)}`);
    }
    appendRemainder(lines, runErrors.length);
  }

  return lines.join("\n");
}

/**
 * @param {JSONReportSuite[]} suites
 * @returns {JSONReportSpec[]}
 */
function collectSpecs(suites) {
  return suites.flatMap((suite) => [
    ...suite.specs,
    ...collectSpecs(suite.suites ?? []),
  ]);
}

/**
 * @param {JSONReportSpec[]} specs
 * @param {JSONReportTest["status"]} status
 */
function collectTests(specs, status) {
  return specs.flatMap((spec) =>
    spec.tests
      .filter((test) => test.status === status)
      .map((test) => ({
        error: testError(test),
        location: `${spec.file}:${spec.line}`,
        project: test.projectName,
        title: spec.title,
      })),
  );
}

/**
 * @param {JSONReportTest} test
 */
function testError(test) {
  const result = test.results.at(-1);
  return firstErrorLine(
    result?.errors.at(0)?.message ?? result?.error?.message,
  );
}

/**
 * @param {string | undefined} message
 */
function firstErrorLine(message) {
  if (!message) return "";
  return (
    stripVTControlCharacters(message)
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean)
      ?.slice(0, 240) ?? ""
  );
}

/**
 * @param {string[]} lines
 * @param {string} heading
 * @param {{ error: string; location: string; project: string; title: string }[]} tests
 * @param {boolean} includeErrors
 */
function appendTestDetails(lines, heading, tests, includeErrors) {
  if (tests.length === 0) return;

  lines.push("", `### ${heading}`);
  for (const test of tests.slice(0, MAX_LISTED_TESTS)) {
    lines.push(
      `- \`${codeText(test.project)}\` ${escapeMarkdown(test.title)} (\`${codeText(test.location)}\`)`,
    );
    if (includeErrors && test.error) {
      lines.push(`  - ${escapeMarkdown(test.error)}`);
    }
  }
  appendRemainder(lines, tests.length);
}

/**
 * @param {string[]} lines
 * @param {number} count
 */
function appendRemainder(lines, count) {
  const remaining = count - MAX_LISTED_TESTS;
  if (remaining > 0) lines.push(`- …and ${remaining} more.`);
}

/**
 * @param {string} value
 */
function escapeMarkdown(value) {
  return value.replace(/([\\`*_[\]<>|])/g, "\\$1");
}

/**
 * @param {string} value
 */
function codeText(value) {
  return value.replaceAll("`", "'");
}

/**
 * @param {string} reportPath
 */
function summarizeFile(reportPath) {
  if (!existsSync(reportPath)) {
    return "_Detailed test results were unavailable because Playwright did not produce its JSON report._";
  }

  const report = /** @type {JSONReport} */ (
    JSON.parse(readFileSync(reportPath, "utf8"))
  );
  return formatIntegrationSummary(report);
}

/**
 * @param {string} summary
 */
function writeGitHubOutputs(summary) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) {
    const delimiter = `INTEGRATION_SUMMARY_${randomUUID()}`;
    appendFileSync(
      outputPath,
      `markdown<<${delimiter}\n${summary}\n${delimiter}\n`,
    );
  }

  const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummaryPath) {
    appendFileSync(
      stepSummaryPath,
      `## Multiplayer Integration Tests\n\n${summary}\n`,
    );
  }
}

const executablePath = process.argv[1];
if (executablePath && import.meta.url === pathToFileURL(executablePath).href) {
  const summary = summarizeFile(process.argv[2] ?? "integration-results.json");
  writeGitHubOutputs(summary);
  console.log(summary);
}
