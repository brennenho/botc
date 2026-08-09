import { describe, expect, it } from "vitest";

import type { GameToken } from "@/lib/game-data/types";
import { normalizeUpdatedTokens } from "@/lib/server/token-normalization";

function bluff(position: number): GameToken {
  return {
    id: `bluff-${position}`,
    gameId: "old-game",
    seatId: null,
    tokenType: "bluff",
    roleId: "slayer",
    label: "Slayer",
    position,
    metadata: {},
  };
}

describe("token update normalization", () => {
  it("preserves semantic token positions while updating ownership", () => {
    const normalized = normalizeUpdatedTokens([bluff(1), bluff(2)], "game-1");

    expect(
      normalized.map(({ gameId, position }) => ({ gameId, position })),
    ).toEqual([
      { gameId: "game-1", position: 1 },
      { gameId: "game-1", position: 2 },
    ]);
  });
});
