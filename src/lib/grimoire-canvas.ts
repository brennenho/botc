import type { GameToken } from "@/lib/game-data/types";

export type CanvasPosition = {
  x: number;
  y: number;
};

export type ReminderPlacement =
  | { mode: "anchored"; order: number }
  | { mode: "free"; canvasPosition: CanvasPosition };

export const PLAYER_POSITION_KIND = "player-position";

export function getDefaultPlayerPosition(
  index: number,
  count: number,
): CanvasPosition {
  const angle = -90 + (360 / Math.max(1, count)) * index;
  const radians = (angle * Math.PI) / 180;

  return {
    x: 50 + Math.cos(radians) * 42.5,
    y: 47 + Math.sin(radians) * 32,
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
  const placement = readReminderPlacement(token);
  return placement.mode === "free" ? placement.canvasPosition : null;
}

export function readReminderPlacement(token: GameToken): ReminderPlacement {
  const value = token.metadata.placement;
  if (value && typeof value === "object") {
    const placement = value as Record<string, unknown>;
    if (placement.mode === "free") {
      const canvasPosition = readCanvasPosition(placement.canvasPosition);
      if (canvasPosition) return { mode: "free", canvasPosition };
    }
    if (
      placement.mode === "anchored" &&
      typeof placement.order === "number" &&
      Number.isFinite(placement.order)
    ) {
      return { mode: "anchored", order: placement.order };
    }
  }

  const legacyPosition = readCanvasPosition(token.metadata.canvasPosition);
  if (legacyPosition) return { mode: "free", canvasPosition: legacyPosition };
  return { mode: "anchored", order: token.position };
}

export function withReminderPlacement(
  metadata: Record<string, unknown>,
  placement: ReminderPlacement,
) {
  return {
    ...withoutCanvasPosition(metadata),
    placement,
  };
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
