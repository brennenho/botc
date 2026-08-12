import { describe, expect, it } from "vitest";

import type { GameToken, Seat } from "@/lib/game-data/types";
import {
  createPlayerSeatView,
  createPlayerSeatViews,
} from "@/lib/player-seat-view";

function seat(overrides: Partial<Seat> = {}): Seat {
  return {
    id: "seat-1",
    seatIndex: 0,
    playerName: "Alice",
    claimedByPlayer: true,
    roleId: "imp",
    alignment: "evil",
    alive: false,
    ghostVoteAvailable: false,
    isTraveller: false,
    joinedAt: "2026-08-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("player seat views", () => {
  it("exposes the name of an online player without hidden game state", () => {
    expect(createPlayerSeatView(seat(), { x: 20, y: 30 })).toEqual({
      id: "seat-1",
      seatIndex: 0,
      playerName: "Alice",
      occupied: true,
      alive: false,
      ghostVoteAvailable: false,
      isTraveller: false,
      position: { x: 20, y: 30 },
    });
  });

  it("presents unclaimed local seats as empty", () => {
    expect(
      createPlayerSeatView(
        seat({ playerName: "Local Player", claimedByPlayer: false }),
        { x: 50, y: 15 },
      ),
    ).toEqual({
      id: "seat-1",
      seatIndex: 0,
      playerName: null,
      occupied: false,
      alive: false,
      ghostVoteAvailable: false,
      isTraveller: false,
      position: { x: 50, y: 15 },
    });
  });

  it("uses storyteller-defined token positions without exposing the token", () => {
    const seats = [seat(), seat({ id: "seat-2", seatIndex: 1 })];
    const positionToken: GameToken = {
      id: "position-1",
      seatId: "seat-1",
      tokenType: "custom",
      roleId: null,
      label: "Player Position",
      position: 0,
      metadata: {
        kind: "player-position",
        canvasPosition: { x: 18, y: 72 },
      },
    };

    expect(createPlayerSeatViews(seats, [positionToken])[0]?.position).toEqual({
      x: 18,
      y: 72,
    });
  });
});
