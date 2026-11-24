import { NextResponse } from "next/server";

import { maxScriptFileBytes } from "@/lib/game-data/custom-script";
import {
  setCredentialCookie,
  storytellerCookieName,
} from "@/lib/server/auth-cookies";
import { GameStoreError } from "@/lib/server/errors";
import { takeRequestRateLimit } from "@/lib/server/rate-limit";
import {
  gameRouteError,
  privateResponseHeaders,
  rateLimitResponse,
} from "@/lib/server/route-errors";
import { createGame } from "@/lib/server/store";
import { createGameSchema } from "@/lib/server/validation";

async function readGameInput(request: Request) {
  const reader = request.body?.getReader();
  if (!reader)
    throw new GameStoreError("invalid_input", "Expected a JSON body.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxScriptFileBytes) {
        await reader.cancel();
        throw new GameStoreError("invalid_input", "Game setup exceeds 256 KB.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let data: unknown;
  try {
    data = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks, bytes)));
  } catch {
    throw new GameStoreError("invalid_input", "Game setup must be valid JSON.");
  }
  return createGameSchema.parse(data);
}

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

    const input = await readGameInput(request);
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
