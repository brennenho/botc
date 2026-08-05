import type { GameToken } from "@/lib/game-data/types";

export type CanvasPosition = {
  x: number;
  y: number;
};

export const PLAYER_POSITION_KIND = "player-position";

export function getDefaultPlayerPosition(
  index: number,
  count: number,
): CanvasPosition {
  const angle = -90 + (360 / Math.max(1, count)) * index;
  const radians = (angle * Math.PI) / 180;

  return {
    x: 50 + Math.cos(radians) * 42.5,
    y: 47 + Math.sin(radians) * 37,
  };
}

export function readCanvasPosition(value: unknown): CanvasPosition | null {
  if (!value || typeof value !== "object") return null;
  const position = value as Record<string, unknown>;
  if (
    typeof position.x !== "number" ||
    !Number.isFinite(position.x) ||
    typeof position.y !== "number" ||
    !Number.isFinite(position.y)
  ) {
    return null;
  }

  return { x: position.x, y: position.y };
}

export function isPlayerPositionToken(token: GameToken) {
  return (
    token.tokenType === "custom" &&
    token.metadata.kind === PLAYER_POSITION_KIND &&
    token.seatId !== null
  );
}

export function getPlayerPosition(
  tokens: GameToken[],
  seatId: string,
  index: number,
  count: number,
) {
  const positionToken = tokens.find(
    (token) => isPlayerPositionToken(token) && token.seatId === seatId,
  );

  return (
    readCanvasPosition(positionToken?.metadata.canvasPosition) ??
    getDefaultPlayerPosition(index, count)
  );
}

export function getReminderPosition(token: GameToken) {
  return readCanvasPosition(token.metadata.canvasPosition);
}

export function clampCanvasPosition(
  position: CanvasPosition,
  horizontalPadding: number,
  verticalPadding: number,
): CanvasPosition {
  return {
    x: Math.max(
      horizontalPadding,
      Math.min(100 - horizontalPadding, position.x),
    ),
    y: Math.max(verticalPadding, Math.min(100 - verticalPadding, position.y)),
  };
}

export function withoutCanvasPosition(metadata: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([key]) => key !== "canvasPosition"),
  );
}
