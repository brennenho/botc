import { describe, expect, it } from "vitest";

import {
  characterSheetTeams,
  getCrossEditionTravellerRoles,
  getCharacterSheetDefinition,
  getEditionRoles,
  getRolesByTeam,
  getTravellerRoles,
  getTravellerSheetDefinition,
  type EditionId,
} from "@/lib/game-data";

const expectedCounts: Record<EditionId, number[]> = {
  tb: [13, 4, 4, 1],
  bmr: [13, 4, 4, 4],
  snv: [13, 4, 4, 4],
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
        getEditionRoles(editionId).filter((role) => role.team !== "traveller"),
      );
    },
  );

  it("provides official ability text and a local image for every character", () => {
    const roles = [
      ...(["tb", "bmr", "snv"] as const).flatMap((editionId) =>
        getCharacterSheetDefinition(editionId).groups.flatMap(
          (group) => group.roles,
        ),
      ),
      ...getTravellerSheetDefinition().groups.flatMap((group) => group.roles),
    ];

    for (const role of roles) {
      expect(role.ability.trim()).not.toBe("");
      expect(role.imagePath).toBe(`/assets/roles/${role.id}.webp`);
    }
  });

  it("provides one dedicated Traveller group per supported script", () => {
    const definition = getTravellerSheetDefinition();

    expect(definition.groups.map((group) => group.edition.id)).toEqual([
      "tb",
      "bmr",
      "snv",
    ]);
    expect(definition.groups.map((group) => group.roles.length)).toEqual([
      5, 5, 5,
    ]);
    expect(definition.roleCount).toBe(15);
    expect(
      new Set(
        definition.groups.flatMap((group) =>
          group.roles.map((role) => role.id),
        ),
      ),
    ).toEqual(new Set(getTravellerRoles().map((role) => role.id)));
  });

  it.each(["tb", "bmr", "snv"] as const)(
    "separates %s Travellers from cross-script options",
    (editionId) => {
      const editionTravellers = getRolesByTeam(editionId).traveller;
      const crossScriptTravellers = getCrossEditionTravellerRoles(editionId);

      expect(editionTravellers).toHaveLength(5);
      expect(crossScriptTravellers).toHaveLength(10);
      expect(
        crossScriptTravellers.every((role) => role.edition !== editionId),
      ).toBe(true);
      expect(new Set([...editionTravellers, ...crossScriptTravellers])).toEqual(
        new Set(getTravellerRoles()),
      );
    },
  );
});
