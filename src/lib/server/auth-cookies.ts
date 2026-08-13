import type { NextResponse } from "next/server";

import { env } from "@/env";
import { normalizeGameCode } from "@/lib/game-code";

export function storytellerCookieName(gameCode: string) {
  return `botc_st_${normalizeGameCode(gameCode)}`;
}

export function playerCookieName(gameCode: string, seatId: string) {
  return `botc_pl_${normalizeGameCode(gameCode)}_${seatId}`;
}

export function setCredentialCookie(
  response: NextResponse,
  name: string,
  credential: string,
) {
  response.cookies.set({
    name,
    value: credential,
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
  });
}
