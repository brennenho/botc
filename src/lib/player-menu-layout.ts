import type { CanvasPosition } from "@/lib/grimoire-canvas";

const DEFAULT_MENU_WIDTH = 320;
const DEFAULT_MENU_HEIGHT = 380;
const DEFAULT_MENU_GAP = 14;
const DEFAULT_MENU_MARGIN = 12;

export function getPlayerMenuPlacement({
  playerPosition,
  boardSize,
  tokenSize,
  menuWidth = DEFAULT_MENU_WIDTH,
  menuHeight = DEFAULT_MENU_HEIGHT,
  gap = DEFAULT_MENU_GAP,
  margin = DEFAULT_MENU_MARGIN,
}: {
  playerPosition: CanvasPosition;
  boardSize: { width: number; height: number };
  tokenSize: number;
  menuWidth?: number;
  menuHeight?: number;
  gap?: number;
  margin?: number;
}) {
  const width = Math.min(menuWidth, boardSize.width - margin * 2);
  const anchorX = (playerPosition.x / 100) * boardSize.width;
  const anchorY = (playerPosition.y / 100) * boardSize.height;
  const rightLeft = anchorX + tokenSize / 2 + gap;
  const leftLeft = anchorX - tokenSize / 2 - gap - width;
  const preferRight = anchorX <= boardSize.width / 2;
  const rightFits = rightLeft + width <= boardSize.width - margin;
  const leftFits = leftLeft >= margin;
  const side =
    (preferRight && rightFits) || !leftFits
      ? ("right" as const)
      : ("left" as const);
  const unclampedLeft = side === "right" ? rightLeft : leftLeft;
  const left = Math.max(
    margin,
    Math.min(unclampedLeft, boardSize.width - width - margin),
  );
  const top = Math.max(
    margin,
    Math.min(anchorY - menuHeight / 2, boardSize.height - menuHeight - margin),
  );
  const anchorOffset = Math.max(24, Math.min(anchorY - top, menuHeight - 24));

  return { side, left, top, width, anchorOffset };
}
