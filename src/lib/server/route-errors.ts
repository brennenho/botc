import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { GameStoreError } from "@/lib/server/errors";

const statusByCode = {
  archived: 410,
  conflict: 409,
  invalid_input: 400,
  no_open_seats: 409,
  not_found: 404,
  unauthorized: 401,
  unavailable: 503,
} as const;

export function gameRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "The request is invalid." },
      { status: 400 },
    );
  }

  if (error instanceof GameStoreError) {
    return NextResponse.json(
      { error: error.message },
      { status: statusByCode[error.code] },
    );
  }

  console.error(error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
