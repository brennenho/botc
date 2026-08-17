import { describe, expect, it, vi } from "vitest";

import type {
  Game,
  GameToken,
  Seat,
  StorytellerSnapshot,
} from "@/lib/game-data/types";
import { readReminderPlacement } from "@/lib/grimoire-canvas";
import { getReminderDefinition } from "@/lib/reminders";
import {
  createSetupRoleMetadata,
  DRUNK_ROLE_ID,
  isSetupRoleToken,
} from "@/lib/setup-effects";

import {
  appendPlayer,
  appendReminder,
  assignSeatRole,
  clearRoleAssignments,
  dealRoles,
  deletePlayer,
  deleteReminder,
  normalizeReminderOrders,
  normalizeSeatIndexes,
  patchSeat,
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
  return { game, seats, gameTokens };
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
        isTraveller: true,
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

  it("preserves a Storyteller-controlled Traveller override across roles", () => {
    const current = state([
      seat("seat-a", 0, {
        roleId: "imp",
        alignment: "evil",
        isTraveller: true,
      }),
    ]);

    const residentRole = assignSeatRole(current, "seat-a", "chef");
    expect(residentRole.seats?.[0]).toMatchObject({
      roleId: "chef",
      alignment: "evil",
      isTraveller: true,
    });

    const nativeTraveller = assignSeatRole(
      { ...current, seats: residentRole.seats! },
      "seat-a",
      "bureaucrat",
    );
    expect(nativeTraveller.seats?.[0]).toMatchObject({
      roleId: "bureaucrat",
      alignment: "evil",
      isTraveller: true,
    });

    const cleared = assignSeatRole(
      { ...current, seats: nativeTraveller.seats! },
      "seat-a",
      null,
    );
    expect(cleared.seats?.[0]).toMatchObject({
      roleId: null,
      alignment: "evil",
      isTraveller: true,
    });
  });

  it("preserves Traveller overrides when clearing all assignments", () => {
    const current = state([
      seat("resident", 0, { roleId: "imp", alignment: "evil" }),
      seat("traveller", 1, {
        roleId: "chef",
        alignment: "evil",
        isTraveller: true,
      }),
    ]);

    const patch = clearRoleAssignments(current);

    expect(patch.seats).toEqual([
      expect.objectContaining({
        id: "resident",
        roleId: null,
        alignment: "good",
        isTraveller: false,
      }),
      expect.objectContaining({
        id: "traveller",
        roleId: null,
        alignment: "evil",
        isTraveller: true,
      }),
    ]);
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

  it("appends reminders only to existing seats with deterministic IDs", () => {
    const definition = getReminderDefinition(null, "Custom");
    const current = state();
    const patch = appendReminder(current, "seat-a", definition, {
      createId: () => "reminder-new",
    });

    expect(patch.gameTokens).toEqual([
      expect.objectContaining({
        id: "reminder-new",
        seatId: "seat-a",
        label: "Custom",
      }),
    ]);
    expect(appendReminder(current, "missing", definition)).toEqual({});
  });
});

describe("role distribution", () => {
  it("preserves traveller seats and position tokens while rebuilding setup markers", () => {
    const residents = Array.from({ length: 7 }, (_, index) =>
      seat(`seat-${index}`, index),
    );
    const traveller = seat("traveller", 7, {
      roleId: "bureaucrat",
      isTraveller: true,
    });
    const positionToken: GameToken = {
      id: "position",
      seatId: "seat-0",
      tokenType: "custom",
      roleId: null,
      label: "Player Position",
      position: 0,
      metadata: {
        kind: "player-position",
        canvasPosition: { x: 25, y: 50 },
      },
    };
    const priorMarker: GameToken = {
      id: "drunk-marker",
      seatId: null,
      tokenType: "custom",
      roleId: DRUNK_ROLE_ID,
      label: "Drunk Selected",
      position: 1,
      metadata: createSetupRoleMetadata(),
    };
    const current = state(
      [...residents, traveller],
      [positionToken, reminder("old-reminder", "seat-0", 0), priorMarker],
    );
    const rolePool = [
      "washerwoman",
      "librarian",
      "chef",
      "empath",
      "monk",
      "baron",
      "imp",
      DRUNK_ROLE_ID,
    ];

    const patch = dealRoles(current, rolePool, { random: () => 0.5 });

    expect(patch.seats).toHaveLength(8);
    expect(patch.seats?.at(-1)).toEqual(traveller);
    expect(patch.seats?.slice(0, 7).every((item) => item.roleId)).toBe(true);
    expect(
      patch.seats
        ?.slice(0, 7)
        .filter((item) => item.roleId === "baron" || item.roleId === "imp")
        .every((item) => item.alignment === "evil"),
    ).toBe(true);
    expect(patch.gameTokens).toEqual([
      positionToken,
      expect.objectContaining({ id: "drunk-marker", roleId: DRUNK_ROLE_ID }),
    ]);
    expect(patch.gameTokens?.filter(isSetupRoleToken)).toHaveLength(1);
  });

  it("drops stale setup markers when the Drunk is not selected", () => {
    const current = state(
      Array.from({ length: 7 }, (_, index) => seat(`seat-${index}`, index)),
      [
        {
          id: "position",
          seatId: "seat-0",
          tokenType: "custom",
          roleId: null,
          label: "Player Position",
          position: 0,
          metadata: { kind: "player-position" },
        },
        {
          id: "setup",
          seatId: null,
          tokenType: "custom",
          roleId: DRUNK_ROLE_ID,
          label: "Drunk Selected",
          position: 1,
          metadata: createSetupRoleMetadata(),
        },
      ],
    );

    const patch = dealRoles(
      current,
      ["washerwoman", "librarian", "chef", "empath", "monk", "baron", "imp"],
      { random: () => 0.5 },
    );

    expect(patch.gameTokens?.map(({ id }) => id)).toEqual(["position"]);
  });
});
