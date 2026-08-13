import {
  createRandomSetup,
  getDefaultAlignment,
  roleById,
} from "@/lib/game-data";
import type {
  GameToken,
  Seat,
  StorytellerPatch,
  StorytellerSnapshot,
} from "@/lib/game-data/types";
import {
  isPlayerPositionToken,
  PLAYER_POSITION_KIND,
  withReminderPlacement,
  type CanvasPosition,
  type ReminderPlacement,
} from "@/lib/grimoire-canvas";
import {
  getAnchoredReminders,
  updateReminderPlacement,
  withReminderKey,
  type ReminderDefinition,
} from "@/lib/reminders";
import {
  createSetupRoleMetadata,
  DRUNK_ROLE_ID,
  isSetupRoleToken,
} from "@/lib/setup-effects";

import {
  resolveGameStateFactories,
  type GameStateFactoryOverrides,
} from "./factories";
import {
  normalizeReminderOrders,
  normalizeSeatIndexes,
  preservePlayerPositionTokens,
} from "./normalization";

type GameState = Pick<StorytellerSnapshot, "game" | "seats" | "gameTokens">;

export type MutableSeatPatch = Partial<
  Pick<
    Seat,
    "playerName" | "alignment" | "alive" | "ghostVoteAvailable" | "isTraveller"
  >
>;

function roleState(roleId: string | null) {
  const role = roleId ? roleById.get(roleId) : null;
  if (roleId && !role) return null;

  return {
    roleId: role?.id ?? null,
    alignment: role ? getDefaultAlignment(role) : ("good" as const),
    isTraveller: role?.team === "traveller",
  };
}

export function createSeat(
  seatIndex: number,
  factories?: GameStateFactoryOverrides,
): Seat {
  const { createId, now } = resolveGameStateFactories(factories);
  return {
    id: createId(),
    seatIndex,
    playerName: `Player ${seatIndex + 1}`,
    claimedByPlayer: false,
    roleId: null,
    alignment: "good",
    alive: true,
    ghostVoteAvailable: true,
    isTraveller: false,
    joinedAt: now(),
  };
}

export function patchSeat(
  current: GameState,
  seatId: string,
  patch: MutableSeatPatch,
): StorytellerPatch {
  if (!current.seats.some((seat) => seat.id === seatId)) return {};

  return {
    seats: normalizeSeatIndexes(
      current.seats.map((seat) =>
        seat.id === seatId
          ? {
              ...seat,
              playerName: patch.playerName ?? seat.playerName,
              alignment: patch.alignment ?? seat.alignment,
              alive: patch.alive ?? seat.alive,
              ghostVoteAvailable:
                patch.ghostVoteAvailable ?? seat.ghostVoteAvailable,
              isTraveller: patch.isTraveller ?? seat.isTraveller,
            }
          : seat,
      ),
    ),
  };
}

export function assignSeatRole(
  current: GameState,
  seatId: string,
  roleId: string | null,
): StorytellerPatch {
  if (!current.seats.some((seat) => seat.id === seatId)) return {};
  const nextRoleState = roleState(roleId);
  if (!nextRoleState) return {};

  return {
    seats: normalizeSeatIndexes(
      current.seats.map((seat) =>
        seat.id === seatId ? { ...seat, ...nextRoleState } : seat,
      ),
    ),
  };
}

export function setDemonBluff(
  current: GameState,
  slot: number,
  roleId: string | null,
  factories?: GameStateFactoryOverrides,
): StorytellerPatch {
  if (!Number.isInteger(slot) || slot < 0 || slot > 2) return {};
  const role = roleId ? roleById.get(roleId) : null;
  if (roleId && !role) return {};

  const existingAtSlot = current.gameTokens.find(
    (token) => token.tokenType === "bluff" && token.position === slot,
  );
  const gameTokens = current.gameTokens.filter(
    (token) =>
      token.tokenType !== "bluff" ||
      (token.position !== slot && token.roleId !== role?.id),
  );
  if (!role) return { gameTokens };

  const { createId } = resolveGameStateFactories(factories);
  return {
    gameTokens: [
      ...gameTokens,
      {
        id: existingAtSlot?.id ?? createId(),
        seatId: null,
        tokenType: "bluff",
        roleId: role.id,
        label: role.name,
        position: slot,
        metadata: {},
      },
    ],
  };
}

export function appendPlayer(
  current: GameState,
  factories?: GameStateFactoryOverrides,
): StorytellerPatch {
  const seats = normalizeSeatIndexes(current.seats);
  return {
    seats: [...seats, createSeat(seats.length, factories)],
  };
}

export function deletePlayer(
  current: GameState,
  seatId: string,
): StorytellerPatch {
  if (!current.seats.some((seat) => seat.id === seatId)) return {};
  return {
    seats: normalizeSeatIndexes(
      current.seats.filter((seat) => seat.id !== seatId),
    ),
    gameTokens: normalizeReminderOrders(
      current.gameTokens.filter((token) => token.seatId !== seatId),
    ),
  };
}

export function dealRoles(
  current: GameState,
  rolePoolIds: readonly string[],
  factories?: GameStateFactoryOverrides,
): StorytellerPatch {
  const { createId, random } = resolveGameStateFactories(factories);
  const drunkSelected = rolePoolIds.includes(DRUNK_ROLE_ID);
  const dealtRoleIds = rolePoolIds.filter((roleId) => roleId !== DRUNK_ROLE_ID);
  const residentSeats = current.seats.filter((seat) => !seat.isTraveller);
  const roleIds = createRandomSetup(
    current.game.edition,
    residentSeats.length,
    random,
    dealtRoleIds,
  );
  if (roleIds.length !== residentSeats.length) return {};

  let residentIndex = 0;
  const seats = normalizeSeatIndexes(
    current.seats.map((seat) => {
      if (seat.isTraveller) return seat;
      const nextRoleState = roleState(roleIds[residentIndex++] ?? null);
      return nextRoleState ? { ...seat, ...nextRoleState } : seat;
    }),
  );
  const gameTokens = preservePlayerPositionTokens(current.gameTokens);
  if (!drunkSelected) return { seats, gameTokens };

  const existingMarker = current.gameTokens.find(
    (token) => isSetupRoleToken(token) && token.roleId === DRUNK_ROLE_ID,
  );
  return {
    seats,
    gameTokens: [
      ...gameTokens,
      {
        id: existingMarker?.id ?? createId(),
        seatId: null,
        tokenType: "custom",
        roleId: DRUNK_ROLE_ID,
        label: "Drunk Selected",
        position: gameTokens.length,
        metadata: createSetupRoleMetadata(),
      },
    ],
  };
}

export function clearRoleAssignments(current: GameState): StorytellerPatch {
  return {
    seats: normalizeSeatIndexes(
      current.seats.map((seat) => ({
        ...seat,
        roleId: null,
        alignment: "good",
        isTraveller: false,
      })),
    ),
    gameTokens: current.gameTokens.filter(
      (token) => token.tokenType === "bluff" || isPlayerPositionToken(token),
    ),
  };
}

export function appendReminder(
  current: GameState,
  seatId: string,
  definition: ReminderDefinition,
  factories?: GameStateFactoryOverrides,
): StorytellerPatch {
  if (!current.seats.some((seat) => seat.id === seatId)) return {};
  const { createId } = resolveGameStateFactories(factories);
  const order = getAnchoredReminders(current.gameTokens, seatId).length;
  const reminder: GameToken = {
    id: createId(),
    seatId,
    tokenType: "reminder",
    roleId: definition.roleId,
    label: definition.label,
    position: current.gameTokens.length,
    metadata: withReminderPlacement(withReminderKey({}, definition.key), {
      mode: "anchored",
      order,
    }),
  };
  return {
    gameTokens: normalizeReminderOrders([...current.gameTokens, reminder]),
  };
}

export function deleteReminder(
  current: GameState,
  tokenId: string,
): StorytellerPatch {
  const reminder = current.gameTokens.find(
    (token) => token.id === tokenId && token.tokenType === "reminder",
  );
  if (!reminder) return {};
  return {
    gameTokens: normalizeReminderOrders(
      current.gameTokens.filter((token) => token.id !== tokenId),
    ),
  };
}

export function setPlayerPosition(
  current: GameState,
  seatId: string,
  position: CanvasPosition,
  factories?: GameStateFactoryOverrides,
): StorytellerPatch {
  if (!current.seats.some((seat) => seat.id === seatId)) return {};
  const existing = current.gameTokens.find(
    (token) => isPlayerPositionToken(token) && token.seatId === seatId,
  );
  const { createId } = resolveGameStateFactories(factories);
  const positionToken: GameToken = {
    id: existing?.id ?? createId(),
    seatId,
    tokenType: "custom",
    roleId: null,
    label: "Player Position",
    position: existing?.position ?? current.gameTokens.length,
    metadata: {
      kind: PLAYER_POSITION_KIND,
      canvasPosition: position,
    },
  };
  return {
    gameTokens: existing
      ? current.gameTokens.map((token) =>
          token.id === existing.id ? positionToken : token,
        )
      : [...current.gameTokens, positionToken],
  };
}

export function setReminderPlacement(
  current: GameState,
  tokenId: string,
  placement: ReminderPlacement,
  seatId?: string,
): StorytellerPatch {
  if (seatId && !current.seats.some((seat) => seat.id === seatId)) return {};
  if (
    !current.gameTokens.some(
      (token) => token.id === tokenId && token.tokenType === "reminder",
    )
  ) {
    return {};
  }

  return {
    gameTokens: normalizeReminderOrders(
      updateReminderPlacement(current.gameTokens, tokenId, placement, seatId),
    ),
  };
}

export function resetTokenPositions(current: GameState): StorytellerPatch {
  const reminderOrders = new Map<string, number>();
  const gameTokens = current.gameTokens
    .filter((token) => !isPlayerPositionToken(token))
    .map((token) => {
      if (token.tokenType !== "reminder" || !token.seatId) return token;
      const order = reminderOrders.get(token.seatId) ?? 0;
      reminderOrders.set(token.seatId, order + 1);
      return {
        ...token,
        metadata: withReminderPlacement(token.metadata, {
          mode: "anchored" as const,
          order,
        }),
      };
    });

  return { gameTokens: normalizeReminderOrders(gameTokens) };
}
