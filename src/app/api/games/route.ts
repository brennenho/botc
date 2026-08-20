import { NextResponse } from "next/server";

import {
  setCredentialCookie,
  storytellerCookieName,
} from "@/lib/server/auth-cookies";
import { takeRequestRateLimit } from "@/lib/server/rate-limit";
import {
  gameRouteError,
  privateResponseHeaders,
  rateLimitResponse,
} from "@/lib/server/route-errors";
import { createGame } from "@/lib/server/store";
import { createGameSchema } from "@/lib/server/validation";

export async function POST(request: Request) {
  const routeContext = { operation: "create_game", request };

  try {
    const rateLimit = takeRequestRateLimit(request, "games:create", {
      limit: 12,
      windowMs: 10 * 60 * 1_000,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds, routeContext);
    }

    const input = createGameSchema.parse(await request.json());
    const game = await createGame(input.edition, input.playerCount);
    const response = NextResponse.json(
      { snapshot: game.snapshot },
      { headers: privateResponseHeaders },
    );

    setCredentialCookie(
      response,
      storytellerCookieName(game.snapshot.game.joinCode),
      game.credential,
    );

    return response;
  } catch (error) {
    return gameRouteError(error, "Unable to create game.", routeContext);
  }
}
