import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { parseScriptExport } from "@/lib/game-data/custom-script";
import {
  getCharacterSheetDefinition,
  getNightOrderEntries,
  roles,
} from "@/lib/game-data";
import { createGameSchema } from "@/lib/server/validation";

describe("official Script Tool uploads", () => {
  const roster = [
    "villageidiot",
    { id: "steward" },
    "ogre",
    "spy",
    "kazali",
    "spiritofivory",
  ];

  it("resolves mixed-edition IDs in file order, including Storyteller rules", () => {
    const script = parseScriptExport([
      { id: "_meta", name: "Mixed", firstNight: ["dusk", "steward", "dawn"] },
      ...roster,
    ]);
    expect(createGameSchema.parse({ edition: script }).edition).toEqual(script);
    const sheet = getCharacterSheetDefinition(script);
    expect(sheet.edition.name).toBe("Mixed");
    expect(sheet.groups[0]?.roles.map((role) => role.name)).toEqual([
      "Village Idiot",
      "Steward",
    ]);
    expect(sheet.groups.at(-1)?.team).toBe("fabled");
    expect(
      getNightOrderEntries(script, "first").map((entry) => entry.id),
    ).toEqual(["dusk", "steward", "dawn"]);
  });

  it("resolves local artwork for every importable official character", () => {
    for (const role of roles)
      expect(
        existsSync(join(process.cwd(), "public", role.imagePath)),
        role.name,
      ).toBe(true);
  });

  it("preserves an explicitly empty night and adds only assigned extra Travellers", () => {
    const script = parseScriptExport([
      {
        id: "_meta",
        firstNight: ["dusk", "spy", "steward", "dawn"],
        otherNight: [],
      },
      ...roster,
    ]);
    expect(getNightOrderEntries(script, "other")).toEqual([]);
    expect(
      getNightOrderEntries(script, "first", ["barista", "barista", "chef"]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["dusk", "spy", "barista", "steward", "dawn"]);
    expect(
      getNightOrderEntries("tb", "first", ["barista"]).map((entry) => entry.id),
    ).toContain("barista");
  });

  it("rejects unknown, duplicate and author-defined characters without partially importing", () => {
    expect(() => parseScriptExport([...roster, "unknown"])).toThrow(
      /Unknown official/,
    );
    expect(() => parseScriptExport([...roster, "villageidiot"])).toThrow(
      /twice/,
    );
    expect(() =>
      parseScriptExport([...roster, { id: "spy", ability: "Changed" }]),
    ).toThrow(/Homebrew/);
    expect(() =>
      parseScriptExport([{ id: "_meta", firstNight: ["imp"] }, ...roster]),
    ).toThrow(/night entry/i);
  });
});
