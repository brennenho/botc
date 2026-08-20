import {
  serializeLogValue,
  stringifyLogValue,
  type LogContext,
} from "@/lib/observability/context";

export function serializeError(error: unknown) {
  return serializeLogValue(error);
}

function propertyValue(error: unknown, property: string) {
  if (!error || (typeof error !== "object" && typeof error !== "function")) {
    return undefined;
  }

  try {
    return (error as Record<string, unknown>)[property];
  } catch {
    return undefined;
  }
}

export function errorLogContext(error: unknown): LogContext {
  const type = error instanceof Error ? error.name : typeof error;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : stringifyLogValue(error);
  const context: LogContext = {
    "exception.details": stringifyLogValue(error),
    "exception.message": message,
    "exception.type": type,
  };

  if (error instanceof Error && error.stack) {
    context["exception.stacktrace"] = error.stack;
  }

  for (const property of [
    "code",
    "details",
    "digest",
    "errno",
    "hint",
    "path",
    "status",
    "statusCode",
    "syscall",
  ]) {
    const value = propertyValue(error, property);
    if (value !== undefined) context[`exception.${property}`] = value;
  }

  return context;
}
