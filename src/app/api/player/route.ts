import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getPlayerSnapshot } from "@/lib/server/store";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const gameId = url.searchParams.get("gameId") ?? "";
    const seatId = url.searchParams.get("seatId") ?? "";
    const explicitToken = url.searchParams.get("token");
    const cookieToken =
      (await cookies()).get(`botc_pl_${gameId}_${seatId}`)?.value ?? "";
    const token =
      explicitToken && explicitToken.length > 0 ? explicitToken : cookieToken;
    const snapshot = await getPlayerSnapshot(gameId, seatId, token);

    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load player." },
      { status: 401 },
    );
  }
}
