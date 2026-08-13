import { normalizeGameCode } from "@/lib/game-code";

export const GAME_INVALIDATION_EVENT = "invalidate";

export type GameInvalidationPayload = {
  gameCode: string;
  version: number;
};

export function getGameInvalidationChannel(gameCode: string) {
  return `game:${normalizeGameCode(gameCode)}`;
}
