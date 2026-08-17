import type { Instrumentation } from "next";

import { sanitizePath } from "@/lib/observability/sanitize";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { registerServerLogging } = await import("@/lib/observability/logs");
    registerServerLogging();
  } catch (error) {
    console.error("Unable to register server observability.", error);
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { reportError } = await import("@/lib/observability/server");
    const route = sanitizePath(context.routePath);

    await reportError(error, {
      method: request.method,
      route,
      route_type: context.routeType,
      source: "next_instrumentation",
    });
  } catch (reportingError) {
    console.error("Unable to report unhandled request error.", reportingError);
  }
};
