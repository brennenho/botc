import { getEditionRoles, roleById } from "@/lib/game-data";
import type { EditionId, GameToken, Role, Seat } from "@/lib/game-data/types";
import { getSetupRoleIds } from "@/lib/setup-effects";
import {
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
