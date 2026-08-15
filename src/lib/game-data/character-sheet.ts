import { getEdition, getRolesByTeam } from "./catalog";
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
