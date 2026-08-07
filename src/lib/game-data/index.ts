import nightsheetRaw from "./nightsheet.json";
import rolesRaw from "./roles.json";
import {
  cleanNightReminderText,
  getNightReminderPlan,
  type NightReminderAction,
} from "./night-reminder-actions";

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

function setupOptions(
  seats: { roleId: string | null; isTraveller?: boolean }[],
): TeamCounts[] {
  const residents = seats.filter((seat) => !seat.isTraveller);
  const base = setupCounts[residents.length];
  if (!base) return [];

  const selectedIds = residents.flatMap((seat) =>
    seat.roleId ? [seat.roleId] : [],
  );
  let outsiderDelta = 0;

  if (selectedIds.includes("baron")) outsiderDelta += 2;
  if (selectedIds.includes("fanggu")) outsiderDelta += 1;
  if (selectedIds.includes("vigormortis")) outsiderDelta -= 1;

  const deltas = selectedIds.includes("godfather")
    ? [outsiderDelta - 1, outsiderDelta + 1]
    : [outsiderDelta];

  return deltas
    .map((delta) => ({
      townsfolk: base.townsfolk - delta,
      outsider: base.outsider + delta,
      minion: base.minion,
      demon: base.demon,
    }))
    .filter((counts) => Object.values(counts).every((count) => count >= 0));
}

function countAssignedTeams(
  seats: { roleId: string | null; isTraveller?: boolean }[],
) {
  return seats.reduce<TeamCounts>((counts, seat) => {
    if (seat.isTraveller || !seat.roleId) return counts;
    const role = roleById.get(seat.roleId);
    if (role && role.team !== "traveller") counts[role.team] += 1;
    return counts;
  }, emptyTeamCounts());
}

function countDistance(a: TeamCounts, b: TeamCounts) {
  return (Object.keys(a) as ResidentTeam[]).reduce(
    (distance, team) => distance + Math.abs(a[team] - b[team]),
    0,
  );
}

export function getSetupAssessment(
  seats: { roleId: string | null; isTraveller?: boolean }[],
): SetupAssessment {
  const residents = seats.filter((seat) => !seat.isTraveller);
  const options = setupOptions(seats);
  const actual = countAssignedTeams(seats);
  const assignedCount = Object.values(actual).reduce(
    (sum, count) => sum + count,
    0,
  );
  const warnings: string[] = [];

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
    legal: missing === 0 && legalCounts && duplicates.length === 0,
    assignedCount,
    expected,
    actual,
    warnings,
  };
}

export function getSetupWarnings(
  seats: { roleId: string | null; isTraveller?: boolean }[],
) {
  return getSetupAssessment(seats).warnings;
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
      let delta = 0;
      if (selectedIds.includes("baron")) delta += 2;
      if (selectedIds.includes("fanggu")) delta += 1;
      if (selectedIds.includes("vigormortis")) delta -= 1;

      const possibleDeltas = selectedIds.includes("godfather")
        ? shuffled([delta - 1, delta + 1], random)
        : [delta];

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
