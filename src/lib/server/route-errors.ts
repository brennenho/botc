import { NextResponse } from "next/server";
import { ZodError } from "zod";

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

export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Wait a moment and try again." },
    {
      status: 429,
      headers: {
        ...privateResponseHeaders,
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

export function gameRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "The request is invalid." },
      { status: 400, headers: privateResponseHeaders },
    );
  }

  if (error instanceof GameStoreError) {
    return NextResponse.json(
      { error: error.message },
      { status: statusByCode[error.code], headers: privateResponseHeaders },
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: fallbackMessage },
    { status: 500, headers: privateResponseHeaders },
  );
}
