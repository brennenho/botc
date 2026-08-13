import { NextResponse } from "next/server";

import {
  setCredentialCookie,
  storytellerCookieName,
} from "@/lib/server/auth-cookies";
import { gameRouteError } from "@/lib/server/route-errors";
import { createGame } from "@/lib/server/store";
import { createGameSchema } from "@/lib/server/validation";

export async function POST(request: Request) {
  try {
    const input = createGameSchema.parse(await request.json());
    const game = await createGame(input.edition, input.playerCount);
    const response = NextResponse.json({ snapshot: game.snapshot });

    setCredentialCookie(
      response,
      storytellerCookieName(game.snapshot.game.joinCode),
      game.credential,
    );

    return response;
  } catch (error) {
    return gameRouteError(error, "Unable to create game.");
  }
}
