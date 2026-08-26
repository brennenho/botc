import { describe, expect, it } from "vitest";

import type { GameToken, Seat } from "@/lib/game-data/types";
import {
  getInPlayReminderSources,
  getPrioritizedInPlayReminderDefinitions,
  getScriptReminderSources,
} from "@/lib/reminder-catalog";
import {
  getReminderDefinition,
  getRoleReminderDefinitions,
  withReminderKey,
} from "@/lib/reminders";
import { roleById } from "@/lib/game-data";
import { createSetupRoleMetadata, DRUNK_ROLE_ID } from "@/lib/setup-effects";

function seat(id: string, seatIndex: number, roleId: string | null): Seat {
  return {
    id,
    seatIndex,
    playerName: `Player ${seatIndex + 1}`,
    claimedByPlayer: false,
    roleId,
    alignment: "good",
    alive: true,
    ghostVoteAvailable: true,
    isTraveller: false,
    joinedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("reminder catalog", () => {
  it("uses the physical Washerwoman token labels and artwork source", () => {
    const washerwoman = roleById.get("washerwoman") ?? null;
    const definitions = getRoleReminderDefinitions(washerwoman);

    expect(definitions.map(({ label }) => label)).toEqual([
      "Townsfolk",
      "Wrong",
    ]);
    expect(definitions.every(({ roleId }) => roleId === "washerwoman")).toBe(
      true,
    );
  });

  it("adds physical setup tokens omitted by roles.json", () => {
    expect(
      getRoleReminderDefinitions(roleById.get("drunk") ?? null).map(
        ({ label }) => label,
      ),
    ).toEqual(["Is The Drunk"]);
    expect(
      getRoleReminderDefinitions(roleById.get("philosopher") ?? null).map(
        ({ label }) => label,
      ),
    ).toContain("Is The Philosopher");
    expect(
      getRoleReminderDefinitions(roleById.get("towncrier") ?? null).map(
        ({ label }) => label,
      ),
    ).toContain("Minion Not Nominated");
  });

  it("prioritizes the selected player's character", () => {
    const sources = getInPlayReminderSources(
      [seat("seat-1", 0, "poisoner"), seat("seat-2", 1, "washerwoman")],
      "seat-2",
    );

    expect(sources[0]?.role.id).toBe("washerwoman");
    expect(sources.map((source) => source.role.id)).toContain("poisoner");
  });

  it("puts an already-used in-play reminder before the selected role", () => {
    const selectedSeat = seat("seat-1", 0, "washerwoman");
    const poisoner = roleById.get("poisoner") ?? null;
    const poisoned = getReminderDefinition(poisoner, "Poisoned");
    const placedReminder: GameToken = {
      id: "placed-poisoned",
      seatId: selectedSeat.id,
      tokenType: "reminder",
      roleId: poisoned.roleId,
      label: poisoned.label,
      position: 0,
      metadata: withReminderKey({}, poisoned.key),
    };

    const definitions = getPrioritizedInPlayReminderDefinitions(
      [selectedSeat, seat("seat-2", 1, "poisoner")],
      selectedSeat.id,
      [placedReminder],
    );

    expect(definitions[0]?.key).toBe(poisoned.key);
    expect(definitions.map(({ label }) => label)).toContain("Townsfolk");
  });

  it("keeps the selected role first when no reminder has been used", () => {
    const selectedSeat = seat("seat-1", 0, "washerwoman");
    const definitions = getPrioritizedInPlayReminderDefinitions(
      [selectedSeat, seat("seat-2", 1, "poisoner")],
      selectedSeat.id,
    );

    expect(definitions.slice(0, 2).map(({ label }) => label)).toEqual([
      "Townsfolk",
      "Wrong",
    ]);
  });

  it("shows a duplicated character source only once", () => {
    const sources = getInPlayReminderSources(
      [seat("seat-1", 0, "poisoner"), seat("seat-2", 1, "poisoner")],
      "seat-1",
    );

    expect(sources.map((source) => source.role.id)).toEqual(["poisoner"]);
  });

  it("includes reminders for a setup role that is not visibly dealt", () => {
    const washerwomanSeat = seat("seat-1", 0, "washerwoman");
    const setupRoleToken: GameToken = {
      id: "drunk-setup",
      seatId: null,
      tokenType: "custom",
      roleId: DRUNK_ROLE_ID,
      label: "Drunk selected",
      position: 0,
      metadata: createSetupRoleMetadata(),
    };
    const sources = getInPlayReminderSources(
      [washerwomanSeat],
      washerwomanSeat.id,
      [setupRoleToken],
    );

    expect(sources.map((source) => source.role.id)).toEqual([
      "washerwoman",
      "drunk",
    ]);
  });

  it("provides every reminder available in the selected script", () => {
    const sources = getScriptReminderSources("tb");
    const definitions = sources.flatMap((source) => source.definitions);

    expect(sources.map((source) => source.role.id)).toContain("drunk");
    expect(definitions.map((definition) => definition.label)).toContain(
      "Is The Drunk",
    );
    expect(definitions.length).toBeGreaterThan(10);
  });
});
