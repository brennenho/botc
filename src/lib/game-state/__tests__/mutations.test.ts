import { describe, expect, it, vi } from "vitest";

import type {
  Game,
  GameToken,
  Seat,
  StorytellerSnapshot,
} from "@/lib/game-data/types";
import {
  getSetupAssessment,
  getSetupReminderWarnings,
  roleById,
} from "@/lib/game-data";
import { parseScriptExport } from "@/lib/game-data/custom-script";
import oneInOneOut from "../../../../public/assets/scripts/one-in-one-out.json";
import { readReminderPlacement } from "@/lib/grimoire-canvas";
import { getReminderDefinition, getReminderKey } from "@/lib/reminders";
import { createSetupRoleMetadata, DRUNK_ROLE_ID } from "@/lib/setup-effects";

import {
  appendPlayer,
  assignSeatRole,
  clearRoleAssignments,
  dealRoles,
  deletePlayer,
  deleteReminder,
  normalizeReminderOrders,
  normalizeSeatIndexes,
  patchSeat,
  placeReminder,
  setDemonBluff,
  setReminderPlacement,
} from "../index";

const game: Game = {
  joinCode: "ABC123",
  edition: "tb",
  phase: "setup",
  dayNumber: 1,
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function seat(id: string, seatIndex: number, patch: Partial<Seat> = {}): Seat {
  return {
    id,
    seatIndex,
    playerName: `Player ${seatIndex + 1}`,
    claimedByPlayer: false,
    roleId: null,
    alignment: "good",
    alive: true,
    ghostVoteAvailable: true,
    isTraveller: false,
    joinedAt: "2026-01-01T00:00:00.000Z",
    ...patch,
  };
}

function state(
  seats: Seat[] = [seat("seat-a", 0), seat("seat-b", 1)],
  gameTokens: GameToken[] = [],
): StorytellerSnapshot {
  return { game, seats, gameTokens, events: [] };
}

function reminder(
  id: string,
  seatId: string,
  order: number,
  label = "Poisoned",
): GameToken {
  return {
    id,
    seatId,
    tokenType: "reminder",
    roleId: "poisoner",
    label,
    position: order,
    metadata: { placement: { mode: "anchored", order } },
  };
}

function anchoredOrders(tokens: readonly GameToken[], seatId: string) {
  return tokens
    .filter(
      (token) => token.tokenType === "reminder" && token.seatId === seatId,
    )
    .map((token) => ({ id: token.id, placement: readReminderPlacement(token) }))
    .sort((left, right) => {
      const leftOrder =
        left.placement.mode === "anchored" ? left.placement.order : Infinity;
      const rightOrder =
        right.placement.mode === "anchored" ? right.placement.order : Infinity;
      return leftOrder - rightOrder;
    });
}

describe("game-state normalization", () => {
  it("normalizes seat indexes without mutating the input", () => {
    const seats = [seat("a", 9), seat("b", -2), seat("c", 2)];
    const normalized = normalizeSeatIndexes(seats);

    expect(normalized.map(({ seatIndex }) => seatIndex)).toEqual([0, 1, 2]);
    expect(seats.map(({ seatIndex }) => seatIndex)).toEqual([9, -2, 2]);
    expect(normalized[2]).toBe(seats[2]);
  });

  it("makes anchored reminder orders contiguous and stable", () => {
    const tokens = [
      reminder("late", "seat-a", 8),
      reminder("first", "seat-a", -2),
      reminder("tie", "seat-a", 8),
      reminder("other", "seat-b", 11),
    ];

    const normalized = normalizeReminderOrders(tokens);

    expect(anchoredOrders(normalized, "seat-a")).toEqual([
      { id: "first", placement: { mode: "anchored", order: 0 } },
      { id: "late", placement: { mode: "anchored", order: 1 } },
      { id: "tie", placement: { mode: "anchored", order: 2 } },
    ]);
    expect(anchoredOrders(normalized, "seat-b")).toEqual([
      { id: "other", placement: { mode: "anchored", order: 0 } },
    ]);
  });
});

describe("seat mutations", () => {
  it("only changes fields owned by the generic seat editor", () => {
    const current = state([seat("seat-a", 4)]);
    const overbroadPatch = {
      id: "foreign-seat",
      seatIndex: 99,
      playerName: "Alice",
      roleId: "imp",
      alignment: "evil" as const,
      isTraveller: true,
    };
    const patch = patchSeat(current, "seat-a", overbroadPatch);

    expect(patch.seats).toEqual([
      expect.objectContaining({
        id: "seat-a",
        seatIndex: 0,
        playerName: "Alice",
        roleId: null,
        alignment: "evil",
        isTraveller: false,
      }),
    ]);
  });

  it("creates players with injected IDs and timestamps", () => {
    const current = state([seat("seat-a", 4)]);
    const patch = appendPlayer(current, {
      createId: () => "seat-new",
      now: () => "2026-02-03T04:05:06.000Z",
    });

    expect(patch.seats).toEqual([
      expect.objectContaining({ id: "seat-a", seatIndex: 0 }),
      expect.objectContaining({
        id: "seat-new",
        seatIndex: 1,
        playerName: "Player 2",
        joinedAt: "2026-02-03T04:05:06.000Z",
      }),
    ]);
  });

  it("derives alignment and traveller state from the assigned role", () => {
    const current = state();

    const demon = assignSeatRole(current, "seat-a", "imp");
    expect(demon.seats?.[0]).toMatchObject({
      roleId: "imp",
      alignment: "evil",
      isTraveller: false,
    });

    const traveller = assignSeatRole(current, "seat-a", "bureaucrat");
    expect(traveller.seats?.[0]).toMatchObject({
      roleId: "bureaucrat",
      alignment: "good",
      isTraveller: true,
    });

    const cleared = assignSeatRole(current, "seat-a", null);
    expect(cleared.seats?.[0]).toMatchObject({
      roleId: null,
      alignment: "good",
      isTraveller: false,
    });
    expect(assignSeatRole(current, "seat-a", "not-a-role")).toEqual({});
  });

  it("keeps a Traveller’s alignment across Traveller roles and resets their status on reassignment or clearing", () => {
    const current = state([
      seat("a", 0, { roleId: "barista", alignment: "evil", isTraveller: true }),
    ]);
    expect(assignSeatRole(current, "a", "bureaucrat").seats?.[0]).toMatchObject(
      { isTraveller: true, alignment: "evil" },
    );
    expect(assignSeatRole(current, "a", "chef").seats?.[0]).toMatchObject({
      isTraveller: false,
      alignment: "good",
    });
    expect(assignSeatRole(current, "a", null).seats?.[0]).toMatchObject({
      roleId: null,
      isTraveller: false,
      alignment: "good",
    });
    expect(clearRoleAssignments(current).seats?.[0]).toMatchObject({
      roleId: null,
      isTraveller: false,
      alignment: "good",
    });
  });

  it("removes every token attached to a player and reindexes seats", () => {
    const current = state(
      [seat("seat-a", 4), seat("seat-b", 8), seat("seat-c", 12)],
      [
        reminder("reminder-a", "seat-b", 0),
        {
          id: "position-b",
          seatId: "seat-b",
          tokenType: "custom",
          roleId: null,
          label: "Player Position",
          position: 1,
          metadata: { kind: "player-position" },
        },
        reminder("reminder-c", "seat-c", 3),
      ],
    );

    const patch = deletePlayer(current, "seat-b");

    expect(
      patch.seats?.map(({ id, seatIndex }) => ({ id, seatIndex })),
    ).toEqual([
      { id: "seat-a", seatIndex: 0 },
      { id: "seat-c", seatIndex: 1 },
    ]);
    expect(patch.gameTokens?.map(({ id }) => id)).toEqual(["reminder-c"]);
    expect(readReminderPlacement(patch.gameTokens![0]!)).toEqual({
      mode: "anchored",
      order: 0,
    });
  });
});

describe("bluff and reminder mutations", () => {
  it("keeps bluff positions and assigned roles unique", () => {
    const current = state(
      [],
      [
        {
          id: "slot-zero",
          seatId: null,
          tokenType: "bluff",
          roleId: "chef",
          label: "Chef",
          position: 0,
          metadata: {},
        },
        {
          id: "duplicate-slot",
          seatId: null,
          tokenType: "bluff",
          roleId: "empath",
          label: "Empath",
          position: 0,
          metadata: {},
        },
        {
          id: "duplicate-role",
          seatId: null,
          tokenType: "bluff",
          roleId: "chef",
          label: "Chef",
          position: 2,
          metadata: {},
        },
      ],
    );

    const patch = setDemonBluff(current, 0, "chef", {
      createId: vi.fn(() => "unused"),
    });
    const bluffs = patch.gameTokens?.filter(
      (token) => token.tokenType === "bluff",
    );

    expect(bluffs).toEqual([
      expect.objectContaining({ id: "slot-zero", roleId: "chef", position: 0 }),
    ]);
    expect(new Set(bluffs?.map(({ position }) => position)).size).toBe(
      bluffs?.length,
    );
    expect(new Set(bluffs?.map(({ roleId }) => roleId)).size).toBe(
      bluffs?.length,
    );
  });

  it("rejects bluff positions outside the three-token tray", () => {
    expect(setDemonBluff(state(), -1, "chef")).toEqual({});
    expect(setDemonBluff(state(), 3, "chef")).toEqual({});
  });

  it("normalizes reminder orders after removing and moving reminders", () => {
    const current = state(undefined, [
      reminder("a", "seat-a", 0),
      reminder("b", "seat-a", 1),
      reminder("c", "seat-a", 2),
      reminder("d", "seat-b", 0),
    ]);

    const removed = deleteReminder(current, "b");
    expect(anchoredOrders(removed.gameTokens!, "seat-a")).toEqual([
      { id: "a", placement: { mode: "anchored", order: 0 } },
      { id: "c", placement: { mode: "anchored", order: 1 } },
    ]);

    const moved = setReminderPlacement(
      { ...current, gameTokens: removed.gameTokens! },
      "c",
      { mode: "anchored", order: 0 },
      "seat-b",
    );
    expect(anchoredOrders(moved.gameTokens!, "seat-a")).toEqual([
      { id: "a", placement: { mode: "anchored", order: 0 } },
    ]);
    expect(anchoredOrders(moved.gameTokens!, "seat-b")).toEqual([
      { id: "c", placement: { mode: "anchored", order: 0 } },
      { id: "d", placement: { mode: "anchored", order: 1 } },
    ]);
  });

  it("places reminders only on existing seats with deterministic IDs", () => {
    const definition = getReminderDefinition(null, "Custom");
    const current = state();
    const patch = placeReminder(current, "seat-a", definition, {
      createId: () => "reminder-new",
    });

    expect(patch.gameTokens).toEqual([
      expect.objectContaining({
        id: "reminder-new",
        seatId: "seat-a",
        label: "Custom",
      }),
    ]);
    expect(placeReminder(current, "missing", definition)).toEqual({});
  });

  it("moves a single-copy reminder instead of creating a duplicate", () => {
    const definition = getReminderDefinition(
      roleById.get("poisoner") ?? null,
      "Poisoned",
    );
    const createId = vi.fn(() => "unused-id");
    const current = state(undefined, [reminder("poisoned", "seat-a", 0)]);
    const patch = placeReminder(current, "seat-b", definition, { createId });
    const poisoned = patch.gameTokens?.filter(
      (token) => getReminderKey(token) === definition.key,
    );

    expect(poisoned).toEqual([
      expect.objectContaining({ id: "poisoned", seatId: "seat-b" }),
    ]);
    expect(readReminderPlacement(poisoned![0]!)).toEqual({
      mode: "anchored",
      order: 0,
    });
    expect(createId).not.toHaveBeenCalled();
  });

  it("uses every physical copy before recycling the oldest one", () => {
    const definition = getReminderDefinition(
      roleById.get("innkeeper") ?? null,
      "Safe",
    );
    const seats = [seat("seat-a", 0), seat("seat-b", 1), seat("seat-c", 2)];
    const createId = vi
      .fn<() => string>()
      .mockReturnValueOnce("safe-a")
      .mockReturnValueOnce("safe-b")
      .mockReturnValue("unused-id");

    const first = placeReminder(state(seats), "seat-a", definition, {
      createId,
    });
    const second = placeReminder(
      state(seats, first.gameTokens),
      "seat-b",
      definition,
      { createId },
    );
    const third = placeReminder(
      state(seats, second.gameTokens),
      "seat-c",
      definition,
      { createId },
    );
    const safeReminders = third.gameTokens
      ?.filter((token) => getReminderKey(token) === definition.key)
      .sort((left, right) => left.id.localeCompare(right.id));

    expect(definition.copies).toBe(2);
    expect(safeReminders).toEqual([
      expect.objectContaining({ id: "safe-a", seatId: "seat-c" }),
      expect.objectContaining({ id: "safe-b", seatId: "seat-b" }),
    ]);
    expect(createId).toHaveBeenCalledTimes(2);
  });
});

describe("role distribution", () => {
  it("deals all three Village Idiots from One In One Out and checks their reminder", () => {
    const current = state(
      Array.from({ length: 7 }, (_, i) => seat(`seat-${i}`, i)),
    );
    current.game = { ...current.game, edition: parseScriptExport(oneInOneOut) };
    const pool = [
      "villageidiot",
      "villageidiot",
      "villageidiot",
      "knight",
      "steward",
      "spy",
      "imp",
    ];
    const dealt = dealRoles(current, pool).seats!;
    expect(dealt.map((s) => s.roleId).sort()).toEqual([...pool].sort());
    expect(getSetupAssessment(dealt).legal).toBe(true);
    const idiot = dealt.find((s) => s.roleId === "villageidiot")!;
    const warning = {
      roleId: "villageidiot",
      roleName: "Village Idiot",
      missing: [{ label: "Drunk", count: 1 }],
    };
    expect(getSetupReminderWarnings(dealt, [])).toContainEqual(warning);
    const placed = {
      ...reminder("drunk-idiot", idiot.id, 0),
      roleId: "villageidiot",
      label: "Drunk",
    };
    expect(getSetupReminderWarnings(dealt, [placed])).not.toContainEqual(
      warning,
    );
    for (const replacement of ["villageidiot", "steward"]) {
      const invalid = pool.map((id) => (id === "knight" ? replacement : id));
      expect(dealRoles(current, invalid)).toEqual({});
      expect(
        getSetupAssessment(
          invalid.map((roleId, i) => seat(`seat-${i}`, i, { roleId })),
        ).legal,
      ).toBe(false);
    }
  });

  it("deals a Legion majority and accepts different mixes of good characters", () => {
    const current = state(
      Array.from({ length: 5 }, (_, i) => seat(`seat-${i}`, i)),
    );
    current.game = {
      ...current.game,
      edition: parseScriptExport(["legion", "imp", "knight", "ogre", "spy"]),
    };
    const pool = ["legion", "legion", "legion", "knight", "ogre"];
    const dealt = dealRoles(current, pool).seats!;
    expect(getSetupAssessment(dealt)).toMatchObject({
      legal: true,
      actual: { townsfolk: 1, outsider: 1, minion: 0, demon: 3 },
    });
    for (const invalid of [
      ["legion", "legion", "knight", "ogre", "imp"],
      ["legion", "legion", "legion", "knight", "spy"],
    ]) {
      expect(dealRoles(current, invalid)).toEqual({});
      expect(
        getSetupAssessment(
          invalid.map((roleId, i) => seat(`seat-${i}`, i, { roleId })),
        ).legal,
      ).toBe(false);
    }
  });

  it("deals only to open seats and preserves assigned players, alignments, and tokens", () => {
    const demon = seat("ada", 1, { roleId: "imp", alignment: "evil" });
    const traveller = seat("cam", 3, {
      roleId: "bureaucrat",
      alignment: "evil",
      isTraveller: true,
    });
    const current = state(
      [seat("ben", 0), demon, seat("dee", 2), traveller],
      [reminder("marked", demon.id, 0)],
    );
    const patch = dealRoles(current, ["chef", "barista"], {
      random: () => 0.5,
    });
    const seats = patch.seats!;
    expect(seats[1]).toEqual(demon);
    expect(seats[3]).toEqual(traveller);
    expect([seats[0]?.roleId, seats[2]?.roleId].sort()).toEqual([
      "barista",
      "chef",
    ]);
    expect(seats.find((s) => s.roleId === "barista")).toMatchObject({
      isTraveller: true,
      alignment: "good",
    });
    expect(patch.gameTokens).toBeUndefined();
    expect(dealRoles({ ...current, seats }, ["chef", "barista"])).toEqual({});
    expect(dealRoles(current, ["imp", "chef"])).toEqual({});
    expect(dealRoles(current, ["chef"])).toEqual({});
    expect(dealRoles(current, ["chef", "knight"])).toEqual({});
  });

  it("adds the Drunk marker once while dealing cover roles to the remaining players", () => {
    const existing = reminder("marked", "ada", 0);
    const current = state(
      [seat("ada", 0, { roleId: "imp" }), seat("ben", 1)],
      [existing],
    );
    const dealt = dealRoles(current, [DRUNK_ROLE_ID, "chef"]);
    expect(dealt.seats?.map((s) => s.roleId)).toEqual(["imp", "chef"]);
    expect(dealt.gameTokens).toEqual([
      existing,
      expect.objectContaining({
        roleId: DRUNK_ROLE_ID,
        metadata: createSetupRoleMetadata(),
      }),
    ]);
    const next = {
      ...current,
      gameTokens: dealt.gameTokens!,
      seats: [...dealt.seats!, seat("cam", 2)],
    };
    expect(dealRoles(next, ["monk", DRUNK_ROLE_ID])).toEqual({});
    const last = dealRoles(next, ["monk"]);
    expect(last.seats?.map((s) => s.roleId)).toEqual(["imp", "chef", "monk"]);
    expect(last.gameTokens).toBeUndefined();
  });

  it("applies the copy limit across assigned and selected roles", () => {
    const current = state([
      seat("a", 0, { roleId: "villageidiot" }),
      seat("b", 1),
      seat("c", 2),
      seat("d", 3),
    ]);
    current.game.edition = { name: "Test", roleIds: ["villageidiot", "imp"] };
    expect(
      dealRoles(current, ["villageidiot", "villageidiot", "villageidiot"]),
    ).toEqual({});
    expect(
      dealRoles(current, ["villageidiot", "villageidiot", "imp"]).seats?.filter(
        (s) => s.roleId === "villageidiot",
      ),
    ).toHaveLength(3);
  });
});
