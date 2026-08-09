import type { GameToken } from "@/lib/game-data/types";

export function normalizeUpdatedTokens(
  gameTokens: GameToken[],
  gameId: string,
): GameToken[] {
  return gameTokens.map((gameToken) => ({
    ...gameToken,
    gameId,
  }));
}
