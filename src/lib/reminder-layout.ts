import type { CanvasPosition } from "@/lib/grimoire-canvas";

type CircularReminderLayoutOptions = {
  index: number;
  count: number;
  outwardAngle: number;
  playerSize: number;
  reminderSize: number;
  clearance: number;
  gap: number;
};

type ReminderSlotOptions = {
  playerPosition: CanvasPosition;
  count: number;
  boardSize: { width: number; height: number };
  playerSize: number;
  reminderSize: number;
  clearance: number;
  gap: number;
};

export type ReminderSnapTarget = {
  seatId: string;
  order: number;
  position: CanvasPosition;
};

export function getCircularReminderOffset({
  index,
  count,
  outwardAngle,
  playerSize,
  reminderSize,
  clearance,
  gap,
}: CircularReminderLayoutOptions) {
  const baseRadius = playerSize / 2 + clearance + reminderSize / 2;
  const ringStride = reminderSize + gap;
  const maxArc = Math.PI * 0.92;
  const rings: { count: number; radius: number }[] = [];
  let remaining = Math.max(1, count);

  for (let ring = 0; remaining > 0; ring += 1) {
    const radius = baseRadius + ring * ringStride;
    const minimumStep = 2 * Math.asin(Math.min(1, ringStride / (2 * radius)));
    const capacity = Math.max(1, Math.floor(maxArc / minimumStep) + 1);
    let ringCount = Math.min(remaining, capacity);

    // Avoid leaving a single token stranded on a second arc.
    if (remaining > capacity && remaining - capacity === 1 && capacity > 2) {
      ringCount -= 1;
    }

    rings.push({ count: ringCount, radius });
    remaining -= ringCount;
  }

  let ringIndex = 0;
  let indexInRing = index;
  while (
    ringIndex < rings.length - 1 &&
    indexInRing >= (rings[ringIndex]?.count ?? 1)
  ) {
    indexInRing -= rings[ringIndex]?.count ?? 1;
    ringIndex += 1;
  }

  const ring = rings[ringIndex] ?? { count: 1, radius: baseRadius };
  const minimumStep =
    ring.count > 1
      ? 2 * Math.asin(Math.min(1, ringStride / (2 * ring.radius)))
      : 0;
  const arcSpan = Math.min(maxArc, minimumStep * (ring.count - 1));
  const inwardAngle = ((outwardAngle + 180) * Math.PI) / 180;
  const angle =
    inwardAngle - arcSpan / 2 + (ring.count > 1 ? indexInRing * minimumStep : 0);

  return {
    x: Math.cos(angle) * ring.radius,
    y: Math.sin(angle) * ring.radius,
  };
}

export function getReminderSlotPositions({
  playerPosition,
  count,
  boardSize,
  playerSize,
  reminderSize,
  clearance,
  gap,
}: ReminderSlotOptions) {
  if (count <= 0) return [];

  const deltaX = ((playerPosition.x - 50) / 100) * boardSize.width;
  const deltaY = ((playerPosition.y - 50) / 100) * boardSize.height;
  const outwardAngle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;

  return Array.from({ length: count }, (_, index) => {
    const offset = getCircularReminderOffset({
      index,
      count,
      outwardAngle,
      playerSize,
      reminderSize,
      clearance,
      gap,
    });
    return {
      x: playerPosition.x + (offset.x / boardSize.width) * 100,
      y: playerPosition.y + (offset.y / boardSize.height) * 100,
    };
  });
}

export function findReminderSnapTarget({
  dropPosition,
  players,
  boardSize,
  playerSize,
  reminderSize,
  clearance,
  gap,
}: {
  dropPosition: CanvasPosition;
  players: {
    seatId: string;
    position: CanvasPosition;
    anchoredReminderCount: number;
  }[];
  boardSize: { width: number; height: number };
  playerSize: number;
  reminderSize: number;
  clearance: number;
  gap: number;
}): ReminderSnapTarget | null {
  const dropPixels = {
    x: (dropPosition.x / 100) * boardSize.width,
    y: (dropPosition.y / 100) * boardSize.height,
  };
  const captureRadius = playerSize * 0.72 + reminderSize * 1.6 + clearance;
  let nearestPlayer:
    | ((typeof players)[number] & { distance: number })
    | undefined;

  for (const player of players) {
    const playerPixels = {
      x: (player.position.x / 100) * boardSize.width,
      y: (player.position.y / 100) * boardSize.height,
    };
    const distance = Math.hypot(
      dropPixels.x - playerPixels.x,
      dropPixels.y - playerPixels.y,
    );
    if (distance > captureRadius) continue;
    if (!nearestPlayer || distance < nearestPlayer.distance) {
      nearestPlayer = { ...player, distance };
    }
  }

  if (!nearestPlayer) return null;

  const slots = getReminderSlotPositions({
    playerPosition: nearestPlayer.position,
    count: nearestPlayer.anchoredReminderCount + 1,
    boardSize,
    playerSize,
    reminderSize,
    clearance,
    gap,
  });
  let order = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const [index, slot] of slots.entries()) {
    const distance = Math.hypot(
      dropPixels.x - (slot.x / 100) * boardSize.width,
      dropPixels.y - (slot.y / 100) * boardSize.height,
    );
    if (distance < nearestDistance) {
      nearestDistance = distance;
      order = index;
    }
  }

  return {
    seatId: nearestPlayer.seatId,
    order,
    position: slots[order] ?? nearestPlayer.position,
  };
}
