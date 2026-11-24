import rolesRaw from "./roles.json";
import type {
  Alignment,
  EditionId,
  GameScript,
  ResidentTeam,
  Role,
  Team,
} from "./types";

type RawRole = Omit<Role, "imagePath"> & { remindersGlobal?: string[] };

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

export const roles: readonly Role[] = (rolesRaw as RawRole[]).map((role) => ({
  ...role,
  imagePath: `/assets/roles/${role.id}.webp`,
  reminders: [...(role.reminders ?? []), ...(role.remindersGlobal ?? [])],
  setup: Boolean(role.setup),
}));

export const roleById = new Map(roles.map((role) => [role.id, role]));

const teamOrder: Record<Team, number> = {
  townsfolk: 0,
  outsider: 1,
  minion: 2,
  demon: 3,
  traveller: 4,
  fabled: 5,
  loric: 6,
};

export function isResidentTeam(team: Team): team is ResidentTeam {
  return team !== "traveller" && team !== "fabled" && team !== "loric";
}

export function getEditionRoles(edition: GameScript) {
  if (typeof edition === "object") {
    return edition.roleIds
      .map((id) => roleById.get(id))
      .filter((role): role is Role => role !== undefined);
  }
  return roles
    .filter((role) => role.edition === edition)
    .sort((a, b) => teamOrder[a.team] - teamOrder[b.team]);
}

export function getRolesByTeam(edition: GameScript) {
  return getEditionRoles(edition).reduce<Record<Team, Role[]>>(
    (groups, role) => {
      groups[role.team].push(role);
      return groups;
    },
    {
      townsfolk: [],
      outsider: [],
      minion: [],
      demon: [],
      traveller: [],
      fabled: [],
      loric: [],
    },
  );
}

export function getTravellerRoles(script?: GameScript) {
  return roles.filter(
    (role) =>
      role.team === "traveller" &&
      (typeof script === "object" ||
        editions.some((edition) => edition.id === role.edition)),
  );
}

export function getCrossEditionTravellerRoles(edition: GameScript) {
  const listed = new Set(getEditionRoles(edition).map((role) => role.id));
  return getTravellerRoles(edition).filter((role) => !listed.has(role.id));
}

export function getDefaultAlignment(role: Role): Alignment {
  return role.team === "minion" || role.team === "demon" ? "evil" : "good";
}

export function getEdition(id: GameScript) {
  if (typeof id === "object")
    return { name: id.name, logoPath: "/assets/editions/custom.webp" };
  return editions.find((edition) => edition.id === id) ?? editions[0];
}

export function teamLabel(team: Team) {
  const labels: Record<Team, string> = {
    townsfolk: "Townsfolk",
    outsider: "Outsider",
    minion: "Minion",
    demon: "Demon",
    traveller: "Traveller",
    fabled: "Fabled",
    loric: "Loric",
  };

  return labels[team];
}
