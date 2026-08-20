import { after, NextResponse } from "next/server";
import { ZodError } from "zod";

import type { ApiErrorPayload, AppErrorCode } from "@/lib/app-error";
import { requestLogContext } from "@/lib/observability/context";
import { errorLogContext } from "@/lib/observability/error-details";
import { logger, type LogLevel } from "@/lib/observability/logger";
import { GameStoreError } from "@/lib/server/errors";

const statusByCode = {
  conflict: 409,
  invalid_input: 400,
  no_open_seats: 409,
  not_found: 404,
  unauthorized: 401,
  unavailable: 503,
} as const;

export const privateResponseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
} as const;

const retryableCodes: ReadonlySet<AppErrorCode> = new Set([
  "rate_limited",
  "unavailable",
  "network",
  "invalid_response",
  "unknown",
]);

export type GameRouteContext = {
  operation: string;
  request: Request;
};

type ErrorResponseOptions = {
  headers?: HeadersInit;
  id?: string;
};

function errorResponse(
  code: AppErrorCode,
  message: string,
  status: number,
  options: ErrorResponseOptions = {},
) {
  return NextResponse.json<ApiErrorPayload>(
    {
      error: {
        code,
        ...(options.id ? { id: options.id } : {}),
        message,
        retryable: retryableCodes.has(code),
      },
    },
    { status, headers: options.headers ?? privateResponseHeaders },
  );
}

function routeErrorContext(
  context: GameRouteContext,
  code: AppErrorCode,
  status: number,
) {
  return {
    ...requestLogContext(context.request),
    app_error_code: code,
    operation: context.operation,
    "http.response.status_code": status,
    source: "game_api",
  };
}

function logExpectedError(
  level: LogLevel,
  message: string,
  error: unknown,
  context: GameRouteContext,
  code: AppErrorCode,
  status: number,
) {
  logger[level](message, {
    ...routeErrorContext(context, code, status),
    ...errorLogContext(error),
    outcome: "expected_error",
  });
}

function scheduleException(
  error: unknown,
  context: GameRouteContext,
  code: AppErrorCode,
  status: number,
) {
  const errorId = crypto.randomUUID();
  const diagnosticContext = {
    ...routeErrorContext(context, code, status),
    error_id: errorId,
  };

  after(async () => {
    try {
      const { captureException } =
        await import("@/lib/observability/server-errors");
      await captureException(error, diagnosticContext);
    } catch (reportingError) {
      logger.error("Unable to capture actionable game API exception", {
        ...diagnosticContext,
        component: "observability",
        ...errorLogContext(reportingError),
      });
    }
  });

  return errorId;
}

export function rateLimitResponse(
  retryAfterSeconds: number,
  context: GameRouteContext,
) {
  logger.warn("Game API request was rate limited", {
    ...routeErrorContext(context, "rate_limited", 429),
    outcome: "expected_error",
    retry_after_seconds: retryAfterSeconds,
  });

  return errorResponse(
    "rate_limited",
    "Too many requests. Wait a moment and try again.",
    429,
    {
      headers: {
        ...privateResponseHeaders,
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

export function gameRouteError(
  error: unknown,
  fallbackMessage: string,
  context: GameRouteContext,
) {
  if (error instanceof ZodError) {
    logExpectedError(
      "info",
      "Game API request contained invalid input",
      error,
      context,
      "invalid_input",
      400,
    );
    return errorResponse(
      "invalid_input",
      error.issues[0]?.message ?? "The request is invalid.",
      400,
    );
  }

  if (error instanceof GameStoreError) {
    const status = statusByCode[error.code];

    if (error.needsDeveloperAttention) {
      const errorId = scheduleException(error, context, error.code, status);
      return errorResponse(error.code, error.message, status, { id: errorId });
    }

    const level: LogLevel =
      error.code === "unavailable"
        ? "error"
        : error.code === "unauthorized"
          ? "warn"
          : "info";
    logExpectedError(
      level,
      "Game API request completed with an expected error",
      error,
      context,
      error.code,
      status,
    );

    return errorResponse(error.code, error.message, status);
  }

  const errorId = scheduleException(error, context, "unknown", 500);
  return errorResponse("unknown", fallbackMessage, 500, { id: errorId });
}
