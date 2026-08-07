import { describe, expect, it } from "vitest";

import { getPlayerMenuPlacement } from "@/lib/player-menu-layout";

const boardSize = { width: 1180, height: 820 };

describe("player menu placement", () => {
  it("opens toward the board from a player on the left", () => {
    const placement = getPlayerMenuPlacement({
      playerPosition: { x: 12, y: 50 },
      boardSize,
      tokenSize: 112,
    });

    expect(placement.side).toBe("right");
    expect(placement.left).toBeGreaterThan((boardSize.width * 12) / 100);
  });

  it("opens toward the board from a player on the right", () => {
    const placement = getPlayerMenuPlacement({
      playerPosition: { x: 88, y: 50 },
      boardSize,
      tokenSize: 112,
    });

    expect(placement.side).toBe("left");
    expect(placement.left + placement.width).toBeLessThan(
      (boardSize.width * 88) / 100,
    );
  });

  it("keeps the menu inside the board at vertical edges", () => {
    const top = getPlayerMenuPlacement({
      playerPosition: { x: 50, y: 4 },
      boardSize,
      tokenSize: 112,
    });
    const bottom = getPlayerMenuPlacement({
      playerPosition: { x: 50, y: 96 },
      boardSize,
      tokenSize: 112,
    });

    expect(top.top).toBe(12);
    expect(bottom.top + 380).toBe(boardSize.height - 12);
  });
});
