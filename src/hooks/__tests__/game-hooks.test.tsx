// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  PlayerSnapshot,
  StorytellerSnapshot,
  VersionedStorytellerPatch,
} from "@/lib/game-data/types";

const apiMocks = vi.hoisted(() => ({
  fetchPlayerGame: vi.fn(),
  fetchStorytellerGame: vi.fn(),
  updateStorytellerGame: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);
vi.mock("@/hooks/use-game-invalidation", () => ({
  useGameInvalidation: vi.fn(),
}));

import { usePlayerGame } from "@/hooks/use-player-game";
import { useStorytellerGame } from "@/hooks/use-storyteller-game";

function storytellerSnapshot(version = 1): StorytellerSnapshot {
  return {
    game: {
      joinCode: "ABC234",
      edition: "tb",
      phase: "setup",
      dayNumber: 1,
      version,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    seats: [
      {
        id: "seat-a",
        seatIndex: 0,
        playerName: "Alice",
        claimedByPlayer: true,
        roleId: null,
        alignment: "good",
        alive: true,
        ghostVoteAvailable: true,
        isTraveller: false,
        joinedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    gameTokens: [],
  };
}

function playerSnapshot(version = 1): PlayerSnapshot {
  const source = storytellerSnapshot(version);
  return {
    game: {
      joinCode: source.game.joinCode,
      edition: source.game.edition,
      phase: source.game.phase,
      dayNumber: source.game.dayNumber,
      version: source.game.version,
    },
    seat: source.seats[0]!,
    seats: [
      {
        id: "seat-a",
        seatIndex: 0,
        playerName: "Alice",
        occupied: true,
        publicRoleId: null,
        alive: true,
        ghostVoteAvailable: true,
        isTraveller: false,
        position: { x: 50, y: 10 },
      },
    ],
  };
}

describe("game synchronization hooks", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it("serializes rapid Storyteller commits with increasing server versions", async () => {
    let server = storytellerSnapshot();
    apiMocks.updateStorytellerGame.mockImplementation(
      async (_gameCode: string, update: VersionedStorytellerPatch) => {
        server = {
          ...server,
          game: {
            ...server.game,
            phase: update.phase ?? server.game.phase,
            dayNumber: update.dayNumber ?? server.game.dayNumber,
            version: server.game.version + 1,
          },
          seats: update.seats ?? server.seats,
          gameTokens: update.gameTokens ?? server.gameTokens,
        };
        return { snapshot: server };
      },
    );

    const { result } = renderHook(() =>
      useStorytellerGame("ABC234", storytellerSnapshot()),
    );

    act(() => {
      result.current.commit({ phase: "day" });
      result.current.commit({ dayNumber: 2 });
    });

    await waitFor(() => expect(result.current.saveState).toBe("idle"));
    expect(apiMocks.updateStorytellerGame).toHaveBeenCalledTimes(2);
    expect(apiMocks.updateStorytellerGame.mock.calls[0]?.[1]).toMatchObject({
      expectedVersion: 1,
      phase: "day",
    });
    expect(apiMocks.updateStorytellerGame.mock.calls[1]?.[1]).toMatchObject({
      expectedVersion: 2,
      dayNumber: 2,
    });
    expect(result.current.snapshot.game).toMatchObject({
      phase: "day",
      dayNumber: 2,
      version: 3,
    });
  });

  it("reconciles the optimistic snapshot after a failed save", async () => {
    const recovered = storytellerSnapshot(2);
    recovered.game.phase = "day";
    apiMocks.updateStorytellerGame.mockRejectedValueOnce(
      new TypeError("network unavailable"),
    );
    apiMocks.fetchStorytellerGame.mockResolvedValueOnce({
      snapshot: recovered,
    });

    const { result } = renderHook(() =>
      useStorytellerGame("ABC234", storytellerSnapshot()),
    );
    act(() => result.current.commit({ phase: "night" }));

    await waitFor(() => expect(result.current.saveState).toBe("error"));
    expect(apiMocks.fetchStorytellerGame).toHaveBeenCalledWith("ABC234");
    expect(result.current.saveError?.reconciled).toBe(true);
    expect(result.current.snapshot.game).toMatchObject({
      phase: "day",
      version: 2,
    });
  });

  it("ignores an older player refresh that resolves after a newer one", async () => {
    let resolveFirst!: (value: { snapshot: PlayerSnapshot }) => void;
    let resolveSecond!: (value: { snapshot: PlayerSnapshot }) => void;
    apiMocks.fetchPlayerGame
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSecond = resolve;
        }),
      );

    const { result } = renderHook(() =>
      usePlayerGame("ABC234", "seat-a", playerSnapshot()),
    );
    act(() => {
      void result.current.refresh();
      void result.current.refresh();
    });

    const newest = playerSnapshot(3);
    newest.game.phase = "night";
    await act(async () => resolveSecond({ snapshot: newest }));
    await waitFor(() => expect(result.current.snapshot.game.version).toBe(3));

    const stale = playerSnapshot(2);
    stale.game.phase = "day";
    await act(async () => resolveFirst({ snapshot: stale }));
    expect(result.current.snapshot.game).toMatchObject({
      phase: "night",
      version: 3,
    });
  });
});
