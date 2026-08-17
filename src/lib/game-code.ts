export const GAME_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;

export function normalizeGameCode(gameCode: string) {
  return gameCode.trim().toUpperCase();
}

export function isValidGameCode(gameCode: string) {
  return GAME_CODE_PATTERN.test(normalizeGameCode(gameCode));
}
