import { describe, expect, it } from "vitest";

import {
  getTownCircleLayout,
  shouldUseCompactTownLayout,
} from "@/lib/town-circle-layout";

const insets = { top: 86, right: 0, bottom: 10, left: 0 };

describe("responsive town circle", () => {
  it("uses the compact layout for narrow and portrait boards", () => {
    expect(shouldUseCompactTownLayout({ width: 390, height: 560 })).toBe(true);
    expect(shouldUseCompactTownLayout({ width: 768, height: 900 })).toBe(true);
    expect(shouldUseCompactTownLayout({ width: 844, height: 390 })).toBe(true);
    expect(shouldUseCompactTownLayout({ width: 1100, height: 700 })).toBe(
      false,
    );
  });

  it("starts at the top and proceeds clockwise", () => {
    const layout = getTownCircleLayout({
      boardSize: { width: 390, height: 560 },
      seatCount: 7,
      insets,
    });

    expect(layout.positions).toHaveLength(7);
    expect(layout.positions[0]?.x).toBeCloseTo(50);
    expect(layout.positions[1]?.x).toBeGreaterThan(50);
    expect(layout.positions[0]?.y).toBeLessThan(layout.positions[1]?.y ?? 0);
  });

  it.each([
    { width: 390, height: 560, seatCount: 7 },
    { width: 390, height: 560, seatCount: 15 },
    { width: 320, height: 460, seatCount: 15 },
  ])("keeps $seatCount seats readable on a $width px board", (boardSize) => {
    const layout = getTownCircleLayout({
      boardSize,
      insets,
      seatCount: boardSize.seatCount,
    });
    const minimumDistance = layout.positions.reduce(
      (minimum, position, index) => {
        const next = layout.positions[(index + 1) % layout.positions.length];
        if (!next) return minimum;
        return Math.min(
          minimum,
          Math.hypot(
            ((next.x - position.x) / 100) * boardSize.width,
            ((next.y - position.y) / 100) * boardSize.height,
          ),
        );
      },
      Number.POSITIVE_INFINITY,
    );

    expect(layout.tokenSize).toBeGreaterThanOrEqual(44);
    expect(minimumDistance).toBeGreaterThanOrEqual(layout.tokenSize - 0.5);
    for (const position of layout.positions) {
      expect(position.x).toBeGreaterThan(0);
      expect(position.x).toBeLessThan(100);
      expect(position.y).toBeGreaterThan(0);
      expect(position.y).toBeLessThan(100);
    }
  });
});
