import { roleById } from "@/lib/game-data";
import type { Seat } from "@/lib/game-data/types";

export function normalizeUpdatedSeats(seats: Seat[], gameId: string): Seat[] {
  return seats.map((seat, index) => {
    const role = seat.roleId ? roleById.get(seat.roleId) : undefined;

    return {
      ...seat,
      gameId,
      seatIndex: index,
      roleId: role?.id ?? null,
      playerName: seat.playerName.trim() || `Player ${index + 1}`,
    };
  });
}
