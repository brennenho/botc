import { NextResponse } from "next/server";
import { z } from "zod";

import { joinGame } from "@/lib/server/store";

const joinSchema = z.object({
  joinCode: z.string().min(4),
  playerName: z.string().min(1).max(40),
});

export async function POST(request: Request) {
  try {
    const input = joinSchema.parse(await request.json());
    const joined = await joinGame(input.joinCode, input.playerName);
    const response = NextResponse.json(joined);

    response.cookies.set({
      name: `botc_pl_${joined.snapshot.game.id}_${joined.seatId}`,
      value: joined.playerToken,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to join game." },
      { status: 400 },
    );
  }
}
