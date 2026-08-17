import { getEdition, getRolesByTeam } from "./catalog";
import type { EditionId, Role, Team } from "./types";

export const characterSheetTeams = [
  "townsfolk",
  "outsider",
  "minion",
  "demon",
  "traveller",
] as const satisfies readonly Team[];

export type CharacterSheetGroup = {
  team: Team;
  roles: Role[];
};

export type CharacterSheetDefinition = {
  edition: ReturnType<typeof getEdition>;
  groups: CharacterSheetGroup[];
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
