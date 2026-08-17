import { after, NextResponse } from "next/server";
import { ZodError } from "zod";

import type { ApiErrorPayload, AppErrorCode } from "@/lib/app-error";
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

function errorResponse(
  code: AppErrorCode,
  message: string,
  status: number,
  headers: HeadersInit = privateResponseHeaders,
) {
  return NextResponse.json<ApiErrorPayload>(
    {
      error: {
        code,
        message,
        retryable: retryableCodes.has(code),
      },
    },
    { status, headers },
  );
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return errorResponse(
    "rate_limited",
    "Too many requests. Wait a moment and try again.",
    429,
    {
      ...privateResponseHeaders,
      "Retry-After": String(retryAfterSeconds),
    },
  );
}

export function gameRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    return errorResponse(
      "invalid_input",
      error.issues[0]?.message ?? "The request is invalid.",
      400,
    );
  }

  if (error instanceof GameStoreError) {
    if (error.code === "unavailable") {
      after(async () => {
        try {
          const { flushServerLogs, logServerEvent } =
            await import("@/lib/observability/logs");
          logServerEvent("warn", "Game storage operation unavailable", {
            error_code: error.code,
          });
          await flushServerLogs();
        } catch (reportingError) {
          console.error(
            "Unable to report game storage failure.",
            reportingError,
          );
        }
      });
    }

    return errorResponse(error.code, error.message, statusByCode[error.code]);
  }

  console.error(error);
  after(async () => {
    try {
      const { reportError } = await import("@/lib/observability/server");
      await reportError(error, { source: "game_api" });
    } catch (reportingError) {
      console.error("Unable to report game API error.", reportingError);
    }
  });
  return errorResponse("unknown", fallbackMessage, 500);
}
