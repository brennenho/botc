import { isTravellerRole } from "@/lib/game-data";
import type { GameToken, PlayerSeatView, Seat } from "@/lib/game-data/types";
import { getPlayerPosition } from "@/lib/grimoire-canvas";

export function createPlayerSeatView(
  seat: Seat,
  position: PlayerSeatView["position"],
): PlayerSeatView {
  const isTraveller = isTravellerRole(seat.roleId);
  return {
    id: seat.id,
    seatIndex: seat.seatIndex,
    playerName: seat.claimedByPlayer ? seat.playerName : null,
    occupied: seat.claimedByPlayer,
    publicRoleId: isTraveller ? seat.roleId : null,
    alive: seat.alive,
    ghostVoteAvailable: seat.ghostVoteAvailable,
    isTraveller,
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
