import { roleById, teamLabel } from "./catalog";
import type {
  GameToken,
  ResidentTeam,
  Role,
  SetupAssessment,
  SetupReminderWarning,
  TeamCounts,
} from "./types";
import {
  DRUNK_REMINDER_LABEL,
  DRUNK_ROLE_ID,
  getDrunkReminder,
  getSetupRoleIds,
  hasDrunkInSetup,
} from "@/lib/setup-effects";

type SetupSeat = {
  id: string;
  roleId: string | null;
  isTraveller?: boolean;
};

const setupReminderRequirements: Record<
  string,
  readonly { label: string; count: number }[]
> = {
  washerwoman: [
    { label: "Townsfolk", count: 1 },
    { label: "Wrong", count: 1 },
  ],
  librarian: [
    { label: "Outsider", count: 1 },
    { label: "Wrong", count: 1 },
  ],
  investigator: [
    { label: "Minion", count: 1 },
    { label: "Wrong", count: 1 },
  ],
  fortuneteller: [{ label: "Red Herring", count: 1 }],
  drunk: [{ label: DRUNK_REMINDER_LABEL, count: 1 }],
  grandmother: [{ label: "Grandchild", count: 1 }],
  tealady: [{ label: "Cannot Die", count: 2 }],
  eviltwin: [{ label: "Twin", count: 1 }],
  nodashii: [{ label: "Poisoned", count: 2 }],
};

export const setupCounts: Record<number, TeamCounts> = {
  5: { townsfolk: 3, outsider: 0, minion: 1, demon: 1 },
  6: { townsfolk: 3, outsider: 1, minion: 1, demon: 1 },
  7: { townsfolk: 5, outsider: 0, minion: 1, demon: 1 },
  8: { townsfolk: 5, outsider: 1, minion: 1, demon: 1 },
  9: { townsfolk: 5, outsider: 2, minion: 1, demon: 1 },
  10: { townsfolk: 7, outsider: 0, minion: 2, demon: 1 },
  11: { townsfolk: 7, outsider: 1, minion: 2, demon: 1 },
  12: { townsfolk: 7, outsider: 2, minion: 2, demon: 1 },
  13: { townsfolk: 9, outsider: 0, minion: 3, demon: 1 },
  14: { townsfolk: 9, outsider: 1, minion: 3, demon: 1 },
  15: { townsfolk: 9, outsider: 2, minion: 3, demon: 1 },
};

function emptyTeamCounts(): TeamCounts {
  return { townsfolk: 0, outsider: 0, minion: 0, demon: 0 };
}

export function getOutsiderDeltas(roleIds: readonly string[]) {
  const selectedIds = new Set(roleIds);
  let delta = 0;

  if (selectedIds.has("baron")) delta += 2;
  if (selectedIds.has("fanggu")) delta += 1;
  if (selectedIds.has("vigormortis")) delta -= 1;

  return selectedIds.has("godfather") ? [delta - 1, delta + 1] : [delta];
}

export function getSetupCountOptions(
  playerCount: number,
  roleIds: readonly string[],
): TeamCounts[] {
  const base = setupCounts[playerCount];
  if (!base) return [];

  return getOutsiderDeltas(roleIds)
    .map((delta) => ({
      townsfolk: base.townsfolk - delta,
      outsider: base.outsider + delta,
      minion: base.minion,
      demon: base.demon,
    }))
    .filter((counts) => Object.values(counts).every((count) => count >= 0));
}

function getSetupOptions(
  seats: readonly SetupSeat[],
  gameTokens: readonly GameToken[],
): TeamCounts[] {
  const residents = seats.filter((seat) => !seat.isTraveller);
  const selectedIds = residents.flatMap((seat) =>
    seat.roleId ? [seat.roleId] : [],
  );

  return getSetupCountOptions(residents.length, [
    ...selectedIds,
    ...getSetupRoleIds(gameTokens),
  ]);
}

function countAssignedTeams(
  seats: readonly SetupSeat[],
  gameTokens: readonly GameToken[],
) {
  const drunkSeatId = getDrunkReminder(gameTokens)?.seatId;

  return seats.reduce<TeamCounts>((counts, seat) => {
    if (seat.isTraveller || !seat.roleId) return counts;
    const role = roleById.get(seat.roleId);
    if (!role || role.team === "traveller") return counts;

    if (seat.id === drunkSeatId && role.team === "townsfolk") {
      counts.outsider += 1;
    } else {
      counts[role.team] += 1;
    }
    return counts;
  }, emptyTeamCounts());
}

function countDistance(a: TeamCounts, b: TeamCounts) {
  return (Object.keys(a) as ResidentTeam[]).reduce(
    (distance, team) => distance + Math.abs(a[team] - b[team]),
    0,
  );
}

export function getSetupTargetCounts(
  playerCount: number,
  roleIds: readonly string[],
) {
  const actual = roleIds.reduce<TeamCounts>((counts, roleId) => {
    const role = roleById.get(roleId);
    if (role && role.team !== "traveller") counts[role.team] += 1;
    return counts;
  }, emptyTeamCounts());

  return (
    [...getSetupCountOptions(playerCount, roleIds)].sort(
      (a, b) => countDistance(a, actual) - countDistance(b, actual),
    )[0] ?? null
  );
}

export function getSetupSelectionTargetCounts(
  playerCount: number,
  roleIds: readonly string[],
) {
  const target = getSetupTargetCounts(playerCount, roleIds);
  if (!target || !roleIds.includes(DRUNK_ROLE_ID)) return target;

  return { ...target, townsfolk: target.townsfolk + 1 };
}

export function getSetupAssessment(
  seats: readonly SetupSeat[],
  gameTokens: readonly GameToken[] = [],
): SetupAssessment {
  const residents = seats.filter((seat) => !seat.isTraveller);
  const options = getSetupOptions(seats, gameTokens);
  const actual = countAssignedTeams(seats, gameTokens);
  const assignedCount = Object.values(actual).reduce(
    (sum, count) => sum + count,
    0,
  );
  const warnings: string[] = [];
  const drunkSelected = hasDrunkInSetup(seats, gameTokens);
  const drunkReminder = getDrunkReminder(gameTokens);
  const drunkSeat = drunkReminder?.seatId
    ? residents.find((seat) => seat.id === drunkReminder.seatId)
    : null;
  const drunkCoverRole = drunkSeat?.roleId
    ? roleById.get(drunkSeat.roleId)
    : null;

  if (drunkSelected && !drunkReminder?.seatId) {
    warnings.push(
      "The Drunk has not been assigned. Place the Is The Drunk reminder on a Townsfolk.",
    );
  } else if (drunkSelected && drunkCoverRole?.team !== "townsfolk") {
    warnings.push("The Is The Drunk reminder should be on a Townsfolk.");
  }

  if (options.length === 0) {
    warnings.push("Base setup counts are defined for 5 to 15 non-Travellers.");
    return { legal: false, assignedCount, expected: null, actual, warnings };
  }

  const assignedRoles = residents
    .map((seat) => (seat.roleId ? roleById.get(seat.roleId) : undefined))
    .filter((role): role is Role => Boolean(role));
  const expected = [...options].sort(
    (a, b) => countDistance(a, actual) - countDistance(b, actual),
  )[0]!;
  const missing = residents.length - assignedCount;

  if (missing > 0) {
    warnings.push(`${missing} player${missing === 1 ? "" : "s"} unassigned.`);
  }

  for (const team of ["townsfolk", "outsider", "minion", "demon"] as const) {
    if (actual[team] !== expected[team]) {
      warnings.push(
        `${teamLabel(team)} count is ${actual[team]}; expected ${expected[team]}.`,
      );
    }
  }

  const duplicates = assignedRoles
    .map((role) => role.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    warnings.push("Duplicate character assignments are present.");
  }

  const legalCounts = options.some(
    (option) => countDistance(option, actual) === 0,
  );

  return {
    legal:
      missing === 0 &&
      legalCounts &&
      duplicates.length === 0 &&
      (!drunkSelected || drunkCoverRole?.team === "townsfolk"),
    assignedCount,
    expected,
    actual,
    warnings,
  };
}

export function getSetupWarnings(
  seats: readonly SetupSeat[],
  gameTokens: readonly GameToken[] = [],
) {
  return getSetupAssessment(seats, gameTokens).warnings;
}

export function getSetupReminderWarnings(
  seats: readonly SetupSeat[],
  gameTokens: readonly GameToken[],
): SetupReminderWarning[] {
  const inPlayRoleIds = new Set([
    ...seats.flatMap((seat) => (seat.roleId ? [seat.roleId] : [])),
    ...getSetupRoleIds(gameTokens),
  ]);
  const hasOutsider =
    hasDrunkInSetup(seats, gameTokens) ||
    seats.some((seat) => {
      const role = seat.roleId ? roleById.get(seat.roleId) : null;
      return role?.team === "outsider";
    });

  return Object.entries(setupReminderRequirements).flatMap(
    ([roleId, requirements]): SetupReminderWarning[] => {
      if (!inPlayRoleIds.has(roleId)) return [];
      if (roleId === "librarian" && !hasOutsider) return [];

      const role = roleById.get(roleId);
      if (!role) return [];

      const missing = requirements.flatMap(({ label, count }) => {
        const placed = gameTokens.filter((token) => {
          if (
            token.tokenType !== "reminder" ||
            token.roleId !== roleId ||
            token.label !== label ||
            !token.seatId
          ) {
            return false;
          }

          if (roleId !== DRUNK_ROLE_ID) return true;
          const seat = seats.find((candidate) => candidate.id === token.seatId);
          const coverRole = seat?.roleId ? roleById.get(seat.roleId) : null;
          return coverRole?.team === "townsfolk";
        }).length;
        const missingCount = Math.max(0, count - placed);
        return missingCount > 0 ? [{ label, count: missingCount }] : [];
      });

      return missing.length > 0
        ? [{ roleId, roleName: role.name, missing }]
        : [];
    },
  );
}
