// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { PlayerApp } from "@/components/player/player-app";
import { StorytellerApp } from "@/components/storyteller/storyteller-app";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Game } from "@/lib/game-data/types";
import { createSeat } from "@/lib/game-state";
import { startStorytellerSessionReplay } from "@/lib/observability/client";
import { createPlayerSeatViews } from "@/lib/player-seat-view";

vi.mock("@/hooks/use-game-invalidation", () => ({
  useGameInvalidation: vi.fn(),
}));
vi.mock("@/hooks/use-game-presence", () => ({
  useGamePresence: () => ({ status: "connected", onlineSeatIds: new Set() }),
}));
vi.mock("@/lib/observability/client", () => ({
  startStorytellerSessionReplay: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("records only the storyteller view when switching roles in the same tab", () => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    },
  );
  const stopReplay = vi.fn();
  vi.mocked(startStorytellerSessionReplay).mockReturnValue(stopReplay);
  const seat = createSeat(0);
  const game: Game = {
    joinCode: "ABC234",
    edition: "tb",
    phase: "setup",
    dayNumber: 1,
    version: 1,
    createdAt: seat.joinedAt,
    updatedAt: seat.joinedAt,
  };
  const player = (
    <PlayerApp
      gameCode={game.joinCode}
      seatId={seat.id}
      initialSnapshot={{ game, seat, seats: createPlayerSeatViews([seat], []) }}
    />
  );
  const view = render(player, { wrapper: TooltipProvider });
  expect(startStorytellerSessionReplay).not.toHaveBeenCalled();

  view.rerender(
    <StorytellerApp
      gameCode={game.joinCode}
      initialSnapshot={{ game, seats: [seat], gameTokens: [] }}
    />,
  );
  expect(startStorytellerSessionReplay).toHaveBeenCalledOnce();
  expect(stopReplay).not.toHaveBeenCalled();

  view.rerender(player);
  expect(stopReplay).toHaveBeenCalledOnce();
  expect(startStorytellerSessionReplay).toHaveBeenCalledOnce();
});
