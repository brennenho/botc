import { describe, expect, it } from "vitest";

import {
  createPublicPlayerTokenModel,
  createStorytellerPlayerTokenModel,
} from "@/components/grimoire/player-token-model";
import type { PlayerSeatView, Seat } from "@/lib/game-data/types";

const ownSeat: Seat = {
  id: "seat-1",
  seatIndex: 0,
  playerName: "Alice",
  claimedByPlayer: true,
  roleId: "washerwoman",
  alignment: "good",
  alive: true,
  ghostVoteAvailable: true,
  isTraveller: false,
  joinedAt: "2026-01-01T00:00:00.000Z",
};

const publicSeat: PlayerSeatView = {
  id: "seat-1",
  seatIndex: 0,
  playerName: "Alice",
  occupied: true,
  publicRoleId: null,
  alive: true,
  ghostVoteAvailable: true,
  isTraveller: false,
  position: { x: 50, y: 10 },
};

describe("player token models", () => {
  it("maps the complete storyteller seat without losing private state", () => {
    const model = createStorytellerPlayerTokenModel(ownSeat);

    expect(model).toMatchObject({
      id: "seat-1",
      playerName: "Alice",
      claimedByPlayer: true,
      alignment: "good",
      alive: true,
    });
    expect(model.role?.id).toBe("washerwoman");
  });

  it("adds private role data only to the player's own public seat", () => {
    const model = createPublicPlayerTokenModel(publicSeat, ownSeat);
    const otherModel = createPublicPlayerTokenModel(
      { ...publicSeat, id: "seat-2", playerName: "Bob" },
      ownSeat,
    );

    expect(model.role?.id).toBe("washerwoman");
    expect(model.alignment).toBe("good");
    expect(otherModel.role).toBeNull();
    expect(otherModel.alignment).toBeNull();
  });

  it("represents an open public seat without inventing private seat fields", () => {
    const model = createPublicPlayerTokenModel(
      {
        ...publicSeat,
        id: "seat-3",
        seatIndex: 2,
        playerName: null,
        occupied: false,
      },
      ownSeat,
    );

    expect(model).toMatchObject({
      playerName: "Seat 3",
      claimedByPlayer: false,
      role: null,
      alignment: null,
    });
  });

  it("shows a marked Traveller's character to other players without alignment", () => {
    const model = createPublicPlayerTokenModel(
      {
        ...publicSeat,
        id: "seat-2",
        playerName: "Bob",
        publicRoleId: "chef",
        isTraveller: true,
      },
      ownSeat,
    );

    expect(model.role?.id).toBe("chef");
    expect(model.isTraveller).toBe(true);
    expect(model.alignment).toBeNull();
  });
});
