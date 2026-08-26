import { getEditionRoles, roleById } from "@/lib/game-data";
import type { EditionId, GameToken, Role, Seat } from "@/lib/game-data/types";
import { getSetupRoleIds } from "@/lib/setup-effects";
import {
  getReminderKey,
  getRoleReminderDefinitions,
  type ReminderDefinition,
} from "@/lib/reminders";

export type ReminderSource = {
  role: Role;
  definitions: ReminderDefinition[];
};

function createReminderSource(role: Role): ReminderSource | null {
  const definitions = getRoleReminderDefinitions(role);
  return definitions.length > 0 ? { role, definitions } : null;
}

export function getInPlayReminderSources(
  seats: Seat[],
  prioritizedSeatId: string,
  gameTokens: readonly GameToken[] = [],
) {
  const prioritizedSeat = seats.find((seat) => seat.id === prioritizedSeatId);
  const orderedSeats = [
    ...(prioritizedSeat ? [prioritizedSeat] : []),
    ...seats
      .filter((seat) => seat.id !== prioritizedSeatId)
      .sort((a, b) => a.seatIndex - b.seatIndex),
  ];
  const seenRoleIds = new Set<string>();

  const roleIds = [
    ...orderedSeats.flatMap((seat) => (seat.roleId ? [seat.roleId] : [])),
    ...getSetupRoleIds(gameTokens),
  ];

  return roleIds.flatMap((roleId): ReminderSource[] => {
    if (seenRoleIds.has(roleId)) return [];
    seenRoleIds.add(roleId);

    const role = roleById.get(roleId);
    const source = role ? createReminderSource(role) : null;
    return source ? [source] : [];
  });
}

export function getScriptReminderSources(editionId: EditionId) {
  return getEditionRoles(editionId).flatMap((role): ReminderSource[] => {
    const source = createReminderSource(role);
    return source ? [source] : [];
  });
}

export function getPrioritizedInPlayReminderDefinitions(
  seats: Seat[],
  prioritizedSeatId: string,
  gameTokens: readonly GameToken[] = [],
) {
  const prioritizedRoleId =
    seats.find((seat) => seat.id === prioritizedSeatId)?.roleId ?? null;
  const placedCounts = gameTokens.reduce((counts, token) => {
    if (token.tokenType !== "reminder") return counts;
    const key = getReminderKey(token);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  return getInPlayReminderSources(seats, prioritizedSeatId, gameTokens)
    .flatMap((source) => source.definitions)
    .map((definition, catalogIndex) => ({ definition, catalogIndex }))
    .sort((first, second) => {
      const firstPlaced = placedCounts.get(first.definition.key) ?? 0;
      const secondPlaced = placedCounts.get(second.definition.key) ?? 0;
      const placedDifference = secondPlaced - firstPlaced;
      if (placedDifference !== 0) return placedDifference;

      const firstBelongsToPlayer =
        first.definition.roleId === prioritizedRoleId ? 1 : 0;
      const secondBelongsToPlayer =
        second.definition.roleId === prioritizedRoleId ? 1 : 0;
      const playerDifference = secondBelongsToPlayer - firstBelongsToPlayer;
      if (playerDifference !== 0) return playerDifference;

      return first.catalogIndex - second.catalogIndex;
    })
    .map(({ definition }) => definition);
}
