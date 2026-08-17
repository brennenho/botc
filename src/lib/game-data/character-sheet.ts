import { editions, getEdition, getRolesByTeam } from "./catalog";
import type { EditionId, ResidentTeam, Role } from "./types";

export const characterSheetTeams = [
  "townsfolk",
  "outsider",
  "minion",
  "demon",
] as const satisfies readonly ResidentTeam[];

export type CharacterSheetGroup = {
  team: ResidentTeam;
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
  editionId: EditionId,
): CharacterSheetDefinition {
  const rolesByTeam = getRolesByTeam(editionId);

  return {
    edition: getEdition(editionId),
    groups: characterSheetTeams.map((team) => ({
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
