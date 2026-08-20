import { PostHog } from "posthog-node";

import { env } from "@/env";
import { observabilityEnabled } from "@/lib/observability/config";
import {
  normalizeLogContext,
  runtimeLogContext,
  type LogContext,
} from "@/lib/observability/context";
import { errorLogContext } from "@/lib/observability/error-details";
import { logger } from "@/lib/observability/logger";

let posthogServer: PostHog | undefined;

function getPostHogServer() {
  posthogServer ??= new PostHog(env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    flushAt: 1,
    flushInterval: 0,
    host: env.NEXT_PUBLIC_POSTHOG_HOST,
  });

  return posthogServer;
}

export async function captureException(
  error: unknown,
  context: LogContext = {},
) {
  const errorId =
    typeof context.error_id === "string"
      ? context.error_id
      : crypto.randomUUID();
  const diagnosticContext = {
    ...context,
    ...errorLogContext(error),
    error_id: errorId,
    signal: "exception",
  };

  logger.error("Unexpected application error", diagnosticContext);
  if (!observabilityEnabled) return errorId;

  try {
    await getPostHogServer().captureExceptionImmediate(error, undefined, {
      ...normalizeLogContext({
        ...runtimeLogContext(),
        ...diagnosticContext,
      }),
      $process_person_profile: false,
    });
  } catch (reportingError) {
    logger.error("PostHog exception delivery failed", {
      component: "observability",
      original_error_id: errorId,
      ...errorLogContext(reportingError),
    });
  }

  return errorId;
}
