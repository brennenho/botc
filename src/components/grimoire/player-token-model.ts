import { roleById } from "@/lib/game-data";
import type {
  Alignment,
  PlayerSeatView,
  Role,
  Seat,
} from "@/lib/game-data/types";

export type PlayerTokenViewModel = {
  id: string;
  seatIndex: number;
  playerName: string;
  claimedByPlayer: boolean;
  role: Role | null;
  alignment: Alignment | null;
  alive: boolean;
  ghostVoteAvailable: boolean;
  isTraveller: boolean;
};

export function createStorytellerPlayerTokenModel(
  seat: Seat,
): PlayerTokenViewModel {
  return {
    id: seat.id,
    seatIndex: seat.seatIndex,
    playerName: seat.playerName,
    claimedByPlayer: seat.claimedByPlayer,
    role: seat.roleId ? (roleById.get(seat.roleId) ?? null) : null,
    alignment: seat.alignment,
    alive: seat.alive,
    ghostVoteAvailable: seat.ghostVoteAvailable,
    isTraveller: seat.isTraveller,
  };
}

export function createPublicPlayerTokenModel(
  seat: PlayerSeatView,
  ownSeat: Seat,
): PlayerTokenViewModel {
  const privateSeat = seat.id === ownSeat.id ? ownSeat : null;
  const visibleRoleId = privateSeat?.roleId ?? seat.publicRoleId;

  return {
    id: seat.id,
    seatIndex: seat.seatIndex,
    playerName: seat.playerName ?? `Seat ${seat.seatIndex + 1}`,
    claimedByPlayer: seat.occupied,
    role: visibleRoleId ? (roleById.get(visibleRoleId) ?? null) : null,
    alignment: privateSeat?.alignment ?? null,
    alive: seat.alive,
    ghostVoteAvailable: seat.ghostVoteAvailable,
    isTraveller: seat.isTraveller,
  };
}
