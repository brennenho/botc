import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  playerCookieName,
  setCredentialCookie,
} from "@/lib/server/auth-cookies";
import { gameRouteError } from "@/lib/server/route-errors";
import { getPlayerSnapshotByCode, joinGame } from "@/lib/server/store";
import { joinGameSchema } from "@/lib/server/validation";

export async function POST(request: Request) {
  try {
    const input = joinGameSchema.parse(await request.json());
    const existingPlayer = await findExistingPlayer(
      input.joinCode,
      input.playerName,
    );
    if (existingPlayer) return createJoinResponse(existingPlayer);

    const joined = await joinGame(input.joinCode, input.playerName);
    return createJoinResponse(joined);
  } catch (error) {
    return gameRouteError(error, "Unable to join game.");
  }
}

async function findExistingPlayer(joinCode: string, playerName: string) {
  const cookieStore = await cookies();
  const cookiePrefix = `botc_pl_${joinCode}_`;
  const normalizedName = playerName.trim().toLocaleLowerCase();

  for (const cookie of cookieStore.getAll()) {
    if (!cookie.name.startsWith(cookiePrefix)) continue;
    const seatId = cookie.name.slice(cookiePrefix.length);
    if (!seatId) continue;

    try {
      const snapshot = await getPlayerSnapshotByCode(
        joinCode,
        seatId,
        cookie.value,
      );
      if (
        snapshot.seat.playerName.trim().toLocaleLowerCase() === normalizedName
      ) {
        return { credential: cookie.value, seatId, snapshot };
      }
    } catch {
      // Ignore expired player cookies and continue looking for a valid seat.
    }
  }

  return null;
}

function createJoinResponse(joined: Awaited<ReturnType<typeof joinGame>>) {
  const response = NextResponse.json({
    seatId: joined.seatId,
    snapshot: joined.snapshot,
  });

  setCredentialCookie(
    response,
    playerCookieName(joined.snapshot.game.joinCode, joined.seatId),
    joined.credential,
  );

  return response;
}
