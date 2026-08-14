import type { CanvasPosition } from "@/lib/grimoire-canvas";

export type TownCircleBoardSize = {
  width: number;
  height: number;
};

export type TownCircleInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type TownCircleLayout = {
  positions: CanvasPosition[];
  tokenSize: number;
  density: "comfortable" | "compact" | "dense";
};

const COMPACT_BOARD_MAX_WIDTH = 720;
const PORTRAIT_BOARD_MAX_WIDTH = 900;
const MAX_COMPACT_TOKEN_SIZE = 84;
const MIN_COMPACT_TOKEN_SIZE = 44;
const TOKEN_SIZE_STEP = 2;

export function shouldUseCompactTownLayout({
  width,
  height,
}: TownCircleBoardSize) {
  return (
    width > 0 &&
    height > 0 &&
    (width <= COMPACT_BOARD_MAX_WIDTH ||
      (width <= PORTRAIT_BOARD_MAX_WIDTH && height > width) ||
      (width <= 1000 && height <= 560))
  );
}

export function getTownCircleLayout({
  boardSize,
  seatCount,
  insets,
}: {
  boardSize: TownCircleBoardSize;
  seatCount: number;
  insets: TownCircleInsets;
}): TownCircleLayout {
  if (seatCount <= 0 || boardSize.width <= 0 || boardSize.height <= 0) {
    return {
      positions: [],
      tokenSize: MIN_COMPACT_TOKEN_SIZE,
      density: "dense",
    };
  }

  const maximumTokenSize = Math.max(
    MIN_COMPACT_TOKEN_SIZE,
    Math.min(
      MAX_COMPACT_TOKEN_SIZE,
      boardSize.width * 0.23,
      (boardSize.height - insets.top - insets.bottom) * 0.2,
    ),
  );
  let tokenSize = roundDownToStep(maximumTokenSize, TOKEN_SIZE_STEP);
  let positions = getPositions({ boardSize, insets, seatCount, tokenSize });

  while (
    tokenSize > MIN_COMPACT_TOKEN_SIZE &&
    getMinimumAdjacentDistance(positions, boardSize) <
      tokenSize + Math.max(6, tokenSize * 0.08)
  ) {
    tokenSize = Math.max(MIN_COMPACT_TOKEN_SIZE, tokenSize - TOKEN_SIZE_STEP);
    positions = getPositions({ boardSize, insets, seatCount, tokenSize });
  }

  return {
    positions,
    tokenSize,
    density:
      seatCount >= 13 || tokenSize <= 50
        ? "dense"
        : seatCount >= 10 || tokenSize <= 64
          ? "compact"
          : "comfortable",
  };
}

function getPositions({
  boardSize,
  insets,
  seatCount,
  tokenSize,
}: {
  boardSize: TownCircleBoardSize;
  insets: TownCircleInsets;
  seatCount: number;
  tokenSize: number;
}) {
  const edgeGap = 10;
  const horizontalLabelClearance = 4;
  const verticalLabelClearance = tokenSize <= 52 ? 24 : 30;
  const left = insets.left + edgeGap + horizontalLabelClearance + tokenSize / 2;
  const right =
    boardSize.width -
    insets.right -
    edgeGap -
    horizontalLabelClearance -
    tokenSize / 2;
  const top = insets.top + verticalLabelClearance + tokenSize / 2;
  const bottom =
    boardSize.height - insets.bottom - verticalLabelClearance - tokenSize / 2;
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  const radiusX = Math.max(0, (right - left) / 2);
  const radiusY = Math.max(0, (bottom - top) / 2);

  return Array.from({ length: seatCount }, (_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / seatCount;
    return {
      x: toPercent(centerX + Math.cos(angle) * radiusX, boardSize.width),
      y: toPercent(centerY + Math.sin(angle) * radiusY, boardSize.height),
    };
  });
}

function getMinimumAdjacentDistance(
  positions: CanvasPosition[],
  boardSize: TownCircleBoardSize,
) {
  if (positions.length <= 1) return Number.POSITIVE_INFINITY;

  return positions.reduce((minimum, position, index) => {
    const next = positions[(index + 1) % positions.length];
    if (!next) return minimum;
    const distance = Math.hypot(
      ((next.x - position.x) / 100) * boardSize.width,
      ((next.y - position.y) / 100) * boardSize.height,
    );
    return Math.min(minimum, distance);
  }, Number.POSITIVE_INFINITY);
}

function roundDownToStep(value: number, step: number) {
  return Math.floor(value / step) * step;
}

function toPercent(value: number, total: number) {
  if (total <= 0) return 50;
  return (value / total) * 100;
}
