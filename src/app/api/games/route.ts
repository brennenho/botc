import { NextResponse } from "next/server";
import { z } from "zod";

import { createGame } from "@/lib/server/store";

const createGameSchema = z.object({
  edition: z.enum(["tb", "bmr", "snv"]),
  playerCount: z.number().int().min(5).max(20).default(7),
});

export async function POST(request: Request) {
  try {
    const input = createGameSchema.parse(await request.json());
    const game = await createGame(input.edition, input.playerCount);
    const response = NextResponse.json(game);

    response.cookies.set({
      name: `botc_st_${game.snapshot.game.joinCode}`,
      value: game.storytellerToken,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create game.",
      },
      { status: 400 },
    );
  }
}
