import { normalizeGameCode } from "@/lib/game-code";

export function getGameInvitationPath(gameCode: string) {
  return `/join/${encodeURIComponent(normalizeGameCode(gameCode))}`;
}

export function getGameInvitationUrl(gameCode: string, origin: string) {
  return new URL(getGameInvitationPath(gameCode), origin).toString();
}
