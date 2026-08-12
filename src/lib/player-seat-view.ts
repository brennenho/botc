import type { GameToken, PlayerSeatView, Seat } from "@/lib/game-data/types";
import { getPlayerPosition } from "@/lib/grimoire-canvas";

export function createPlayerSeatView(
  seat: Seat,
  position: PlayerSeatView["position"],
): PlayerSeatView {
  return {
    id: seat.id,
    seatIndex: seat.seatIndex,
    playerName: seat.claimedByPlayer ? seat.playerName : null,
    occupied: seat.claimedByPlayer,
    alive: seat.alive,
    ghostVoteAvailable: seat.ghostVoteAvailable,
    isTraveller: seat.isTraveller,
    position,
  };
}

export function createPlayerSeatViews(
  seats: Seat[],
  gameTokens: GameToken[],
): PlayerSeatView[] {
  return seats.map((seat, index) =>
    createPlayerSeatView(
      seat,
      getPlayerPosition(gameTokens, seat.id, index, seats.length),
    ),
  );
}
