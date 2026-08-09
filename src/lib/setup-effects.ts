import type { GameToken, Seat } from "@/lib/game-data/types";

export const SETUP_ROLE_TOKEN_KIND = "setup-role";
export const DRUNK_ROLE_ID = "drunk";
export const DRUNK_REMINDER_LABEL = "Is The Drunk";

export function createSetupRoleMetadata() {
  return { kind: SETUP_ROLE_TOKEN_KIND };
}

export function isSetupRoleToken(token: GameToken) {
  return (
    token.tokenType === "custom" &&
    token.seatId === null &&
    token.metadata.kind === SETUP_ROLE_TOKEN_KIND
  );
}

export function getSetupRoleIds(gameTokens: readonly GameToken[]) {
  return gameTokens.flatMap((token) =>
    isSetupRoleToken(token) && token.roleId ? [token.roleId] : [],
  );
}

export function isDrunkReminder(token: GameToken) {
  return (
    token.tokenType === "reminder" &&
    token.roleId === DRUNK_ROLE_ID &&
    token.label === DRUNK_REMINDER_LABEL
  );
}

export function hasDrunkInSetup(
  seats: readonly Pick<Seat, "roleId">[],
  gameTokens: readonly GameToken[],
) {
  return (
    seats.some((seat) => seat.roleId === DRUNK_ROLE_ID) ||
    getSetupRoleIds(gameTokens).includes(DRUNK_ROLE_ID)
  );
}

export function getDrunkReminder(gameTokens: readonly GameToken[]) {
  return gameTokens.find(isDrunkReminder) ?? null;
}
