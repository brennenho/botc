import nightsheetRaw from "./nightsheet.json";
import rolesRaw from "./roles.json";
import {
  cleanNightReminderText,
  getNightReminderPlan,
  type NightReminderAction,
} from "./night-reminder-actions";
import type { GameToken } from "./types";
import {
  DRUNK_REMINDER_LABEL,
  DRUNK_ROLE_ID,
  getDrunkReminder,
  getSetupRoleIds,
  hasDrunkInSetup,
} from "@/lib/setup-effects";

export type EditionId = "tb" | "bmr" | "snv";
export type Team = "townsfolk" | "outsider" | "minion" | "demon" | "traveller";
export type Alignment = "good" | "evil";
export type Phase = "setup" | "day" | "night" | "finished";

export type Role = {
  id: string;
  name: string;
  edition: EditionId;
  team: Team;
  ability: string;
  flavor?: string;
  firstNightReminder?: string;
  otherNightReminder?: string;
  reminders: string[];
  setup: boolean;
  imagePath: string;
};

type RawRole = Omit<Role, "edition" | "imagePath"> & {
  edition: string;
};

type NightSheet = {
  firstNight: string[];
  otherNight: string[];
};

export type ResidentTeam = Exclude<Team, "traveller">;
export type TeamCounts = Record<ResidentTeam, number>;

export type SetupAssessment = {
  legal: boolean;
  assignedCount: number;
  expected: TeamCounts | null;
  actual: TeamCounts;
  warnings: string[];
};

export type SetupReminderWarning = {
  roleId: string;
  roleName: string;
  missing: { label: string; count: number }[];
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

export type NightOrderEntry = {
  id: string;
  name: string;
  reminder: string;
  reminderActions: NightReminderAction[];
  role: Role | null;
  system: boolean;
};

export const editions = [
  {
    id: "tb",
    name: "Trouble Brewing",
    shortName: "TB",
    logoPath: "/assets/editions/tb.webp",
    tone: "Foundational deduction with clean teaching rhythms.",
  },
  {
    id: "bmr",
    name: "Bad Moon Rising",
    shortName: "BMR",
    logoPath: "/assets/editions/bmr.webp",
    tone: "Deaths, survivals, and timing puzzles in a stormier town.",
  },
  {
    id: "snv",
    name: "Sects & Violets",
    shortName: "S&V",
    logoPath: "/assets/editions/snv.webp",
    tone: "Information volatility, madness pressure, and role swaps.",
  },
] as const satisfies readonly {
  id: EditionId;
  name: string;
  shortName: string;
  logoPath: string;
  tone: string;
}[];

export const roles: Role[] = (rolesRaw as RawRole[])
  .filter((role): role is RawRole & { edition: EditionId } =>
    ["tb", "bmr", "snv"].includes(role.edition),
  )
  .map((role) => ({
    ...role,
    imagePath: `/assets/roles/${role.id}.webp`,
    reminders: role.reminders ?? [],
    setup: Boolean(role.setup),
  }));

export const roleById = new Map(roles.map((role) => [role.id, role]));

const teamOrder: Record<Team, number> = {
  townsfolk: 0,
  outsider: 1,
  minion: 2,
  demon: 3,
  traveller: 4,
};

export function getEditionRoles(edition: EditionId) {
  return roles
    .filter((role) => role.edition === edition)
    .sort((a, b) => teamOrder[a.team] - teamOrder[b.team]);
}

export function getRolesByTeam(edition: EditionId) {
  return getEditionRoles(edition).reduce<Record<Team, Role[]>>(
    (groups, role) => {
      groups[role.team].push(role);
      return groups;
    },
    { townsfolk: [], outsider: [], minion: [], demon: [], traveller: [] },
  );
}

export function getDefaultAlignment(role: Role): Alignment {
  return role.team === "minion" || role.team === "demon" ? "evil" : "good";
}

export function getEdition(id: EditionId) {
  return editions.find((edition) => edition.id === id) ?? editions[0];
}

export function getNightOrder(edition: EditionId, night: "first" | "other") {
  const editionRoleIds = new Set(
    getEditionRoles(edition).map((role) => role.id),
  );
  const sheet: NightSheet = nightsheetRaw;
  const ids = night === "first" ? sheet.firstNight : sheet.otherNight;

  return ids
    .filter((id) => editionRoleIds.has(id))
    .map((id) => roleById.get(id))
    .filter((role): role is Role => Boolean(role));
}

const systemNightEntries: Record<
  string,
  Omit<NightOrderEntry, "id" | "role" | "system" | "reminderActions">
> = {
  dusk: { name: "Dusk", reminder: "The night begins." },
  minioninfo: {
    name: "Minion information",
    reminder: "Show the Minions the Demon and each other.",
  },
  demoninfo: {
    name: "Demon information",
    reminder: "Show the Demon the Minions and three not-in-play characters.",
  },
  dawn: { name: "Dawn", reminder: "The night ends." },
};

export function getNightOrderEntries(
  edition: EditionId,
  night: "first" | "other",
) {
  const editionRoleIds = new Set(
    getEditionRoles(edition).map((role) => role.id),
  );
  const sheet: NightSheet = nightsheetRaw;
  const ids = night === "first" ? sheet.firstNight : sheet.otherNight;

  return ids.flatMap((id): NightOrderEntry[] => {
    const systemEntry = systemNightEntries[id];
    if (systemEntry) {
      return [
        {
          id,
          ...systemEntry,
          reminderActions: [],
          role: null,
          system: true,
        },
      ];
    }

    const role = roleById.get(id);
    if (!role || !editionRoleIds.has(id)) return [];

    const plan = getNightReminderPlan(role.id, night);
    const rawReminder =
      (night === "first" ? role.firstNightReminder : role.otherNightReminder) ??
      role.ability;

    return [
      {
        id,
        name: role.name,
        reminder: plan?.summary ?? cleanNightReminderText(rawReminder),
        reminderActions: plan?.actions ?? [],
        role,
        system: false,
      },
    ];
  });
}

export const setupCounts: Record<
  number,
  { townsfolk: number; outsider: number; minion: number; demon: number }
> = {
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

function getOutsiderDeltas(roleIds: readonly string[]) {
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

function setupOptions(
  seats: { id: string; roleId: string | null; isTraveller?: boolean }[],
  gameTokens: readonly GameToken[],
): TeamCounts[] {
  const residents = seats.filter((seat) => !seat.isTraveller);
  const base = setupCounts[residents.length];
  if (!base) return [];

  const selectedIds = residents.flatMap((seat) =>
    seat.roleId ? [seat.roleId] : [],
  );

  return getSetupCountOptions(residents.length, [
    ...selectedIds,
    ...getSetupRoleIds(gameTokens),
  ]);
}

function countAssignedTeams(
  seats: { id: string; roleId: string | null; isTraveller?: boolean }[],
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
  seats: { id: string; roleId: string | null; isTraveller?: boolean }[],
  gameTokens: readonly GameToken[] = [],
): SetupAssessment {
  const residents = seats.filter((seat) => !seat.isTraveller);
  const options = setupOptions(seats, gameTokens);
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

  if (missing > 0)
    warnings.push(`${missing} player${missing === 1 ? "" : "s"} unassigned.`);

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
  seats: { id: string; roleId: string | null; isTraveller?: boolean }[],
  gameTokens: readonly GameToken[] = [],
) {
  return getSetupAssessment(seats, gameTokens).warnings;
}

export function getSetupReminderWarnings(
  seats: { id: string; roleId: string | null; isTraveller?: boolean }[],
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
          )
            return false;

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

function shuffled<T>(items: readonly T[], random: () => number) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other]!, result[index]!];
  }
  return result;
}

function combinations<T>(items: readonly T[], count: number): T[][] {
  if (count === 0) return [[]];
  if (items.length < count) return [];

  return items.flatMap((item, index) =>
    combinations(items.slice(index + 1), count - 1).map((rest) => [
      item,
      ...rest,
    ]),
  );
}

export function createRandomSetup(
  edition: EditionId,
  playerCount: number,
  random: () => number = Math.random,
  allowedRoleIds?: readonly string[],
) {
  const base = setupCounts[playerCount];
  const allowed = allowedRoleIds ? new Set(allowedRoleIds) : null;
  const editionRoles = getEditionRoles(edition).filter(
    (role) => role.team !== "traveller" && (!allowed || allowed.has(role.id)),
  );

  if (allowed) {
    if (editionRoles.length !== playerCount) return [];
    return shuffled(editionRoles, random).map((role) => role.id);
  }

  if (!base) {
    if (editionRoles.length < playerCount) return [];
    return shuffled(editionRoles, random)
      .slice(0, playerCount)
      .map((role) => role.id);
  }

  const groups = editionRoles.reduce<Record<ResidentTeam, Role[]>>(
    (result, role) => {
      if (role.team !== "traveller") result[role.team].push(role);
      return result;
    },
    { townsfolk: [], outsider: [], minion: [], demon: [] },
  );
  const demonOptions = shuffled(groups.demon, random);
  const minionOptions = shuffled(
    combinations(groups.minion, base.minion),
    random,
  );

  for (const demon of demonOptions) {
    for (const minions of minionOptions) {
      const selectedIds = [demon.id, ...minions.map((role) => role.id)];
      const possibleDeltas = shuffled(getOutsiderDeltas(selectedIds), random);

      for (const candidate of possibleDeltas) {
        const outsiderCount = base.outsider + candidate;
        const townsfolkCount = base.townsfolk - candidate;
        if (outsiderCount < 0 || townsfolkCount < 0) continue;
        if (
          groups.outsider.length < outsiderCount ||
          groups.townsfolk.length < townsfolkCount
        )
          continue;

        const outsiders = shuffled(groups.outsider, random).slice(
          0,
          outsiderCount,
        );
        const townsfolk = shuffled(groups.townsfolk, random).slice(
          0,
          townsfolkCount,
        );
        const selected = [demon, ...minions, ...outsiders, ...townsfolk];
        if (selected.length === playerCount) {
          return shuffled(selected, random).map((role) => role.id);
        }
      }
    }
  }

  return shuffled(editionRoles, random)
    .slice(0, playerCount)
    .map((role) => role.id);
}

export function canCreateRandomSetup(
  edition: EditionId,
  playerCount: number,
  allowedRoleIds: readonly string[],
) {
  return (
    createRandomSetup(edition, playerCount, () => 0.5, allowedRoleIds)
      .length === playerCount
  );
}

export function teamLabel(team: Team) {
  const labels: Record<Team, string> = {
    townsfolk: "Townsfolk",
    outsider: "Outsider",
    minion: "Minion",
    demon: "Demon",
    traveller: "Traveller",
  };

  return labels[team];
}
