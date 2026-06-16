import nightsheetRaw from "./nightsheet.json";
import rolesRaw from "./roles.json";

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
  const editionRoleIds = new Set(getEditionRoles(edition).map((role) => role.id));
  const sheet: NightSheet = nightsheetRaw;
  const ids = night === "first" ? sheet.firstNight : sheet.otherNight;

  return ids
    .filter((id) => editionRoleIds.has(id))
    .map((id) => roleById.get(id))
    .filter((role): role is Role => Boolean(role));
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

export function getSetupWarnings(
  seats: { roleId: string | null; isTraveller?: boolean }[],
) {
  const residents = seats.filter((seat) => !seat.isTraveller);
  const counts = setupCounts[residents.length];
  const warnings: string[] = [];

  if (!counts) {
    warnings.push("Base setup counts are defined for 5 to 15 non-Travellers.");
    return warnings;
  }

  const assignedRoles = residents
    .map((seat) => (seat.roleId ? roleById.get(seat.roleId) : undefined))
    .filter((role): role is Role => Boolean(role));
  const actual = assignedRoles.reduce<Record<Exclude<Team, "traveller">, number>>(
    (acc, role) => {
      if (role.team !== "traveller") acc[role.team] += 1;
      return acc;
    },
    { townsfolk: 0, outsider: 0, minion: 0, demon: 0 },
  );

  for (const team of ["townsfolk", "outsider", "minion", "demon"] as const) {
    if (actual[team] !== counts[team]) {
      warnings.push(
        `${teamLabel(team)} count is ${actual[team]}; expected ${counts[team]} for ${residents.length} players.`,
      );
    }
  }

  const duplicates = assignedRoles
    .map((role) => role.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    warnings.push("Duplicate character assignments are present.");
  }

  return warnings;
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
