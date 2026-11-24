import { editions, getEdition, getRolesByTeam } from "./catalog";
import type { GameScript, ResidentTeam, Team, Role } from "./types";

export const characterSheetTeams = [
  "townsfolk",
  "outsider",
  "minion",
  "demon",
] as const satisfies readonly ResidentTeam[];

const customSheetTeams: readonly Team[] = [
  ...characterSheetTeams,
  "traveller",
  "fabled",
  "loric",
];

export type CharacterSheetGroup = {
  team: Team;
  roles: Role[];
};

export type CharacterSheetDefinition = {
  edition: ReturnType<typeof getEdition>;
  groups: CharacterSheetGroup[];
};

export type TravellerSheetGroup = {
  edition: (typeof editions)[number];
  roles: Role[];
};

export type TravellerSheetDefinition = {
  groups: TravellerSheetGroup[];
  roleCount: number;
};

export function getCharacterSheetDefinition(
  editionId: GameScript,
): CharacterSheetDefinition {
  const rolesByTeam = getRolesByTeam(editionId);

  const teams: readonly Team[] =
    typeof editionId === "object"
      ? customSheetTeams.filter((team) => rolesByTeam[team].length > 0)
      : characterSheetTeams;
  return {
    edition: getEdition(editionId),
    groups: teams.map((team) => ({
      team,
      roles: rolesByTeam[team],
    })),
  };
}

export function getTravellerSheetDefinition(): TravellerSheetDefinition {
  const groups = editions.map((edition) => ({
    edition,
    roles: getRolesByTeam(edition.id).traveller,
  }));

  return {
    groups,
    roleCount: groups.reduce((count, group) => count + group.roles.length, 0),
  };
}
