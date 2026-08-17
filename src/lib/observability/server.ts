import { PostHog } from "posthog-node";

import { env } from "@/env";
import { observabilityEnabled } from "@/lib/observability/config";
import { flushServerLogs, logServerEvent } from "@/lib/observability/logs";

type ErrorContext = Record<string, string | number | boolean>;

let posthogServer: PostHog | undefined;

function getPostHogServer() {
  posthogServer ??= new PostHog(env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    flushAt: 20,
    flushInterval: 10_000,
    host: env.NEXT_PUBLIC_POSTHOG_HOST,
  });

  return posthogServer;
}

async function sendException(error: unknown, context: ErrorContext) {
  try {
    await getPostHogServer().captureExceptionImmediate(error, undefined, {
      ...context,
      $process_person_profile: false,
    });
  } catch (reportingError) {
    console.error("Unable to send server exception.", reportingError);
  }
}

export async function reportError(error: unknown, context: ErrorContext = {}) {
  if (!observabilityEnabled) return;

  try {
    logServerEvent("error", "Server error reported", {
      ...context,
      error_type: error instanceof Error ? error.name : "unknown",
    });
    await Promise.all([sendException(error, context), flushServerLogs()]);
  } catch (reportingError) {
    console.error("Unable to report server error.", reportingError);
  }
}
