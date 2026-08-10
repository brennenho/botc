import { describe, expect, it } from "vitest";

import type { Seat } from "@/lib/game-data/types";
import { normalizeUpdatedSeats } from "@/lib/server/seat-normalization";

function seat(overrides: Partial<Seat> = {}): Seat {
  return {
    id: "seat-1",
    seatIndex: 4,
    playerName: "Player 1",
    roleId: null,
    alignment: "good",
    alive: true,
    ghostVoteAvailable: true,
    isTraveller: false,
    joinedAt: "2026-08-06T00:00:00.000Z",
    ...overrides,
  };
}

describe("seat update normalization", () => {
  it("preserves a storyteller-selected alignment without a role", () => {
    const [normalized] = normalizeUpdatedSeats([seat({ alignment: "evil" })]);

    expect(normalized?.alignment).toBe("evil");
  });

  it("normalizes seat order, names, and invalid roles", () => {
    const [normalized] = normalizeUpdatedSeats([
      seat({ playerName: "  ", roleId: "not-a-role" }),
    ]);

    expect(normalized).toMatchObject({
      seatIndex: 0,
      playerName: "Player 1",
      roleId: null,
    });
  });
});
