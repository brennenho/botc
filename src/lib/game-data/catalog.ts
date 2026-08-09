import rolesRaw from "./roles.json";
import type { Alignment, EditionId, Role, Team } from "./types";

type RawRole = Omit<Role, "edition" | "imagePath"> & {
  edition: string;
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

export const roles: readonly Role[] = (rolesRaw as RawRole[])
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
