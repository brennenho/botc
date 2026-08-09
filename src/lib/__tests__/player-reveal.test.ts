import { describe, expect, it } from "vitest";

import { getNightOrderEntries } from "@/lib/game-data";
import { getNightRevealActions } from "@/lib/player-reveal";

function entry(
  edition: "tb" | "bmr" | "snv",
  night: "first" | "other",
  id: string,
) {
  const result = getNightOrderEntries(edition, night).find(
    (candidate) => candidate.id === id,
  );
  if (!result) throw new Error(`Missing ${edition} ${night} entry: ${id}`);
  return result;
}

describe("night player reveals", () => {
  it("offers dedicated first-night information reveals", () => {
    expect(getNightRevealActions(entry("tb", "first", "minioninfo"))).toEqual([
      expect.objectContaining({
        label: "Show the Demon",
        reveal: { type: "minion-information" },
      }),
    ]);
    expect(getNightRevealActions(entry("tb", "first", "demoninfo"))).toEqual([
      expect.objectContaining({
        label: "Show Demon Information",
        reveal: { type: "demon-information" },
      }),
    ]);
  });

  it("asks the Storyteller to choose a role for You Are prompts", () => {
    expect(
      getNightRevealActions(entry("tb", "other", "scarletwoman")),
    ).toContainEqual(
      expect.objectContaining({
        label: "Show Their Character",
        chooseRoleHeading: "You Are",
      }),
    );
  });

  it("uses the acting role for selected-character information", () => {
    expect(
      getNightRevealActions(entry("bmr", "other", "exorcist")),
    ).toContainEqual(
      expect.objectContaining({
        label: "Show Who Selected Them",
        reveal: {
          type: "role",
          heading: "This Character Selected You",
          roleId: "exorcist",
        },
      }),
    );
  });

  it("does not add reveal controls to ordinary instructions", () => {
    expect(getNightRevealActions(entry("tb", "other", "monk"))).toEqual([]);
  });
});
