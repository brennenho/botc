import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { normalizeGameCode } from "@/lib/game-code";
import { getPlayerSnapshotByCode } from "@/lib/server/store";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const gameCode = normalizeGameCode(url.searchParams.get("code") ?? "");
    const seatId = url.searchParams.get("seatId") ?? "";
    const explicitToken = url.searchParams.get("token");
    const cookieToken =
      (await cookies()).get(`botc_pl_${gameCode}_${seatId}`)?.value ?? "";
    const token =
      explicitToken && explicitToken.length > 0 ? explicitToken : cookieToken;
    const snapshot = await getPlayerSnapshotByCode(gameCode, seatId, token);

    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load player.",
      },
      { status: 401 },
    );
  }
}
