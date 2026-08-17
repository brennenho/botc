import { describe, expect, it } from "vitest";

import {
  characterSheetTeams,
  getCharacterSheetDefinition,
  getEditionRoles,
  type EditionId,
} from "@/lib/game-data";

const expectedCounts: Record<EditionId, number[]> = {
  tb: [13, 4, 4, 1, 5],
  bmr: [13, 4, 4, 4, 5],
  snv: [13, 4, 4, 4, 5],
};

describe("character sheet definitions", () => {
  it.each(["tb", "bmr", "snv"] as const)(
    "contains the complete %s script in physical-sheet order",
    (editionId) => {
      const definition = getCharacterSheetDefinition(editionId);

      expect(definition.groups.map((group) => group.team)).toEqual(
        characterSheetTeams,
      );
      expect(definition.groups.map((group) => group.roles.length)).toEqual(
        expectedCounts[editionId],
      );
      expect(definition.groups.flatMap((group) => group.roles)).toEqual(
        getEditionRoles(editionId),
      );
    },
  );

  it("provides official ability text and a local image for every character", () => {
    for (const editionId of ["tb", "bmr", "snv"] as const) {
      const roles = getCharacterSheetDefinition(editionId).groups.flatMap(
        (group) => group.roles,
      );

      for (const role of roles) {
        expect(role.ability.trim()).not.toBe("");
        expect(role.imagePath).toBe(`/assets/roles/${role.id}.webp`);
      }
    }
  });
});
