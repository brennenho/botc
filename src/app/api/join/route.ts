import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeGameCode } from "@/lib/game-code";
import { getPlayerSnapshotByCode, joinGame } from "@/lib/server/store";

const joinSchema = z.object({
  joinCode: z.string().min(4),
  playerName: z.string().min(1).max(40),
});

export async function POST(request: Request) {
  try {
    const input = joinSchema.parse(await request.json());
    const joinCode = normalizeGameCode(input.joinCode);
    const existingPlayer = await findExistingPlayer(joinCode, input.playerName);
    if (existingPlayer) return createJoinResponse(existingPlayer);

    const joined = await joinGame(input.joinCode, input.playerName);
    return createJoinResponse(joined);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to join game.",
      },
      { status: 400 },
    );
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
        snapshot.game.status === "active" &&
        snapshot.seat.playerName.trim().toLocaleLowerCase() === normalizedName
      ) {
        return { playerToken: cookie.value, seatId, snapshot };
      }
    } catch {
      // Ignore expired player cookies and continue looking for a valid seat.
    }
  }

  return null;
}

function createJoinResponse(joined: Awaited<ReturnType<typeof joinGame>>) {
  const response = NextResponse.json(joined);

  response.cookies.set({
    name: `botc_pl_${joined.snapshot.game.joinCode}_${joined.seatId}`,
    value: joined.playerToken,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
