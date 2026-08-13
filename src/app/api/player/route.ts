import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { playerCookieName } from "@/lib/server/auth-cookies";
import { gameRouteError } from "@/lib/server/route-errors";
import { getPlayerSnapshotByCode } from "@/lib/server/store";
import { gameCodeSchema, seatIdSchema } from "@/lib/server/validation";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const gameCode = gameCodeSchema.parse(url.searchParams.get("code") ?? "");
    const seatId = seatIdSchema.parse(url.searchParams.get("seatId") ?? "");
    const credential =
      (await cookies()).get(playerCookieName(gameCode, seatId))?.value ?? "";
    const snapshot = await getPlayerSnapshotByCode(
      gameCode,
      seatId,
      credential,
    );

    return NextResponse.json({ snapshot });
  } catch (error) {
    return gameRouteError(error, "Unable to load player.");
  }
}
