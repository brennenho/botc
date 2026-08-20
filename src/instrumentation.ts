import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { registerServerLogging } =
      await import("@/lib/observability/logger");
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
    const { captureException } =
      await import("@/lib/observability/server-errors");
    const requestId = request.headers["x-vercel-id"];

    await captureException(error, {
      method: request.method,
      path: request.path,
      request_id: Array.isArray(requestId) ? requestId.join(",") : requestId,
      route: context.routePath,
      route_type: context.routeType,
      source: "next_instrumentation",
    });
  } catch (reportingError) {
    console.error("Unable to report unhandled request error.", reportingError);
  }
};
