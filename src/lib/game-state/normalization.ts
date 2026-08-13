import type { GameToken, Seat } from "@/lib/game-data/types";
import {
  isPlayerPositionToken,
  readReminderPlacement,
  withReminderPlacement,
} from "@/lib/grimoire-canvas";

export function normalizeSeatIndexes(seats: readonly Seat[]): Seat[] {
  return seats.map((seat, seatIndex) =>
    seat.seatIndex === seatIndex ? seat : { ...seat, seatIndex },
  );
}

export function normalizeReminderOrders(
  gameTokens: readonly GameToken[],
): GameToken[] {
  const anchoredBySeat = new Map<
    string,
    { token: GameToken; sourceIndex: number; order: number }[]
  >();

  gameTokens.forEach((token, sourceIndex) => {
    if (token.tokenType !== "reminder" || !token.seatId) return;
    const placement = readReminderPlacement(token);
    if (placement.mode !== "anchored") return;

    const reminders = anchoredBySeat.get(token.seatId) ?? [];
    reminders.push({ token, sourceIndex, order: placement.order });
    anchoredBySeat.set(token.seatId, reminders);
  });

  const normalizedOrderById = new Map<string, number>();
  for (const reminders of anchoredBySeat.values()) {
    reminders
      .sort((left, right) =>
        left.order === right.order
          ? left.sourceIndex - right.sourceIndex
          : left.order - right.order,
      )
      .forEach(({ token }, order) => normalizedOrderById.set(token.id, order));
  }

  return gameTokens.map((token) => {
    const order = normalizedOrderById.get(token.id);
    if (order === undefined) return token;

    const placement = readReminderPlacement(token);
    return placement.mode === "anchored" && placement.order === order
      ? token
      : {
          ...token,
          metadata: withReminderPlacement(token.metadata, {
            mode: "anchored",
            order,
          }),
        };
  });
}

export function preservePlayerPositionTokens(
  gameTokens: readonly GameToken[],
): GameToken[] {
  return gameTokens.filter(isPlayerPositionToken);
}
