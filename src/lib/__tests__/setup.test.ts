import { describe, expect, it } from "vitest";

import {
  getSetupAssessment,
  getSetupCountOptions,
  getSetupReminderWarnings,
  getSetupSelectionTargetCounts,
  type TeamCounts,
} from "@/lib/game-data";
import type { GameToken, Seat } from "@/lib/game-data/types";
import {
  createSetupRoleMetadata,
  DRUNK_REMINDER_LABEL,
  DRUNK_ROLE_ID,
} from "@/lib/setup-effects";

const sevenPlayerCounts: TeamCounts = {
  townsfolk: 5,
  outsider: 0,
  minion: 1,
  demon: 1,
};

function seat(seatIndex: number, roleId: string): Seat {
  return {
    id: `seat-${seatIndex}`,
    seatIndex,
    playerName: `Player ${seatIndex + 1}`,
    claimedByPlayer: false,
    roleId,
    alignment: roleId === "baron" || roleId === "imp" ? "evil" : "good",
    alive: true,
    ghostVoteAvailable: true,
    isTraveller: false,
    joinedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("setup modifiers", () => {
  it("excludes a Storyteller-marked Traveller regardless of native team", () => {
    const residents = [
      seat(0, "washerwoman"),
      seat(1, "librarian"),
      seat(2, "chef"),
      seat(3, "empath"),
      seat(4, "monk"),
      seat(5, "poisoner"),
      seat(6, "imp"),
    ];
    const customTraveller = {
      ...seat(7, "baron"),
      alignment: "evil" as const,
      isTraveller: true,
    };

    expect(getSetupAssessment([...residents, customTraveller])).toMatchObject({
      legal: true,
      assignedCount: 7,
      expected: sevenPlayerCounts,
      actual: sevenPlayerCounts,
    });
  });

  it("adds a Townsfolk token to a Drunk distribution pool", () => {
    expect(getSetupSelectionTargetCounts(7, ["baron", DRUNK_ROLE_ID])).toEqual({
      townsfolk: 4,
      outsider: 2,
      minion: 1,
      demon: 1,
    });
  });

  it("applies the Baron while counting the marked Townsfolk as the Drunk", () => {
    const seats = [
      seat(0, "washerwoman"),
      seat(1, "librarian"),
      seat(2, "empath"),
      seat(3, "chef"),
      seat(4, "saint"),
      seat(5, "baron"),
      seat(6, "imp"),
    ];
    const gameTokens: GameToken[] = [
      {
        id: "drunk-setup",
        seatId: null,
        tokenType: "custom",
        roleId: DRUNK_ROLE_ID,
        label: "Drunk selected",
        position: 0,
        metadata: createSetupRoleMetadata(),
      },
      {
        id: "drunk-reminder",
        seatId: seats[3]!.id,
        tokenType: "reminder",
        roleId: DRUNK_ROLE_ID,
        label: DRUNK_REMINDER_LABEL,
        position: 1,
        metadata: {},
      },
    ];

    expect(getSetupCountOptions(7, ["baron", "drunk"])).toEqual([
      { townsfolk: 3, outsider: 2, minion: 1, demon: 1 },
    ]);
    expect(getSetupAssessment(seats, gameTokens)).toMatchObject({
      legal: true,
      expected: { townsfolk: 3, outsider: 2, minion: 1, demon: 1 },
      actual: { townsfolk: 3, outsider: 2, minion: 1, demon: 1 },
    });
  });

  it("covers every setup-changing character in the base editions", () => {
    expect(getSetupCountOptions(7, ["drunk"])).toEqual([sevenPlayerCounts]);
    expect(getSetupCountOptions(8, ["godfather"])).toEqual([
      { townsfolk: 6, outsider: 0, minion: 1, demon: 1 },
      { townsfolk: 4, outsider: 2, minion: 1, demon: 1 },
    ]);
    expect(getSetupCountOptions(7, ["fanggu"])).toEqual([
      { townsfolk: 4, outsider: 1, minion: 1, demon: 1 },
    ]);
    expect(getSetupCountOptions(8, ["vigormortis"])).toEqual([
      { townsfolk: 6, outsider: 0, minion: 1, demon: 1 },
    ]);
  });
});

describe("Drunk reminder", () => {
  it("warns while the selected Drunk has not been placed", () => {
    const seats = [
      seat(0, "washerwoman"),
      seat(1, "librarian"),
      seat(2, "empath"),
      seat(3, "chef"),
      seat(4, "saint"),
      seat(5, "baron"),
      seat(6, "imp"),
    ];
    const setupToken: GameToken = {
      id: "drunk-setup",
      seatId: null,
      tokenType: "custom",
      roleId: DRUNK_ROLE_ID,
      label: "Drunk selected",
      position: 0,
      metadata: createSetupRoleMetadata(),
    };
    const assessment = getSetupAssessment(seats, [setupToken]);

    expect(assessment.legal).toBe(false);
    expect(assessment.warnings).toContain(
      "The Drunk has not been assigned. Place the Is The Drunk reminder on a Townsfolk.",
    );
  });
});

describe("setup reminder warnings", () => {
  it("lists every missing setup reminder for the characters in play", () => {
    const seats = [
      seat(0, "washerwoman"),
      seat(1, "fortuneteller"),
      seat(2, "saint"),
      seat(3, "chef"),
      seat(4, "empath"),
      seat(5, "poisoner"),
      seat(6, "imp"),
    ];
    const setupToken: GameToken = {
      id: "drunk-setup",
      seatId: null,
      tokenType: "custom",
      roleId: DRUNK_ROLE_ID,
      label: "Drunk selected",
      position: 0,
      metadata: createSetupRoleMetadata(),
    };

    expect(getSetupReminderWarnings(seats, [setupToken])).toEqual([
      {
        roleId: "washerwoman",
        roleName: "Washerwoman",
        missing: [
          { label: "Townsfolk", count: 1 },
          { label: "Wrong", count: 1 },
        ],
      },
      {
        roleId: "fortuneteller",
        roleName: "Fortune Teller",
        missing: [{ label: "Red Herring", count: 1 }],
      },
      {
        roleId: DRUNK_ROLE_ID,
        roleName: "Drunk",
        missing: [{ label: DRUNK_REMINDER_LABEL, count: 1 }],
      },
    ]);
  });

  it("clears setup warnings as the required reminders are placed", () => {
    const seats = [
      seat(0, "washerwoman"),
      seat(1, "fortuneteller"),
      seat(2, "saint"),
      seat(3, "chef"),
      seat(4, "empath"),
      seat(5, "poisoner"),
      seat(6, "imp"),
    ];
    const gameTokens: GameToken[] = [
      {
        id: "drunk-setup",
        seatId: null,
        tokenType: "custom",
        roleId: DRUNK_ROLE_ID,
        label: "Drunk selected",
        position: 0,
        metadata: createSetupRoleMetadata(),
      },
      ...[
        ["washerwoman", "Townsfolk", seats[0]!.id],
        ["washerwoman", "Wrong", seats[2]!.id],
        ["fortuneteller", "Red Herring", seats[3]!.id],
        [DRUNK_ROLE_ID, DRUNK_REMINDER_LABEL, seats[4]!.id],
      ].map(
        ([roleId, label, seatId], index): GameToken => ({
          id: `reminder-${index}`,
          seatId: seatId!,
          tokenType: "reminder",
          roleId: roleId!,
          label: label!,
          position: index + 1,
          metadata: {},
        }),
      ),
    ];

    expect(getSetupReminderWarnings(seats, gameTokens)).toEqual([]);
  });

  it("reports duplicate setup reminders as a remaining count", () => {
    const seats = [seat(0, "tealady"), seat(1, "sailor")];
    const cannotDie: GameToken = {
      id: "cannot-die",
      seatId: seats[1]!.id,
      tokenType: "reminder",
      roleId: "tealady",
      label: "Cannot Die",
      position: 0,
      metadata: {},
    };

    expect(getSetupReminderWarnings(seats, [cannotDie])).toEqual([
      {
        roleId: "tealady",
        roleName: "Tea Lady",
        missing: [{ label: "Cannot Die", count: 1 }],
      },
    ]);
  });
});
