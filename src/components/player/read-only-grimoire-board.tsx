"use client";

import { PlayerToken } from "@/components/grimoire/player-token";
import type { PlayerSeatView, Seat } from "@/lib/game-data/types";
import { getGrimoirePlayerTokenSize } from "@/lib/grimoire-canvas";
import { getPlayerLabelSide } from "@/lib/reminder-layout";

export function ReadOnlyGrimoireBoard({
  seats,
  ownSeat,
  onlineSeatIds,
  redacted,
}: {
  seats: PlayerSeatView[];
  ownSeat: Seat;
  onlineSeatIds: ReadonlySet<string>;
  redacted: boolean;
}) {
  const orderedSeats = [...seats].sort((a, b) => a.seatIndex - b.seatIndex);
  const tokenSize = getGrimoirePlayerTokenSize(orderedSeats.length);

  return (
    <div className="grimoire-frame player-grimoire-frame">
      <div className="grimoire-board" aria-label="Town Seating">
        {orderedSeats.map((seatView) => {
          const isOwnSeat = seatView.id === ownSeat.id;
          const seat = createPublicSeat(seatView, isOwnSeat ? ownSeat : null);
          const labelSide = getPlayerLabelSide({
            playerPosition: seatView.position,
          });

          return (
            <div
              key={seat.id}
              className="canvas-player-position"
              style={{
                left: `${seatView.position.x}%`,
                top: `${seatView.position.y}%`,
              }}
            >
              <PlayerToken
                seat={seat}
                selected={false}
                tokenSize={tokenSize}
                labelSide={labelSide}
                redacted={redacted}
                readOnly
                publicView
                isOwnSeat={isOwnSeat}
                presenceStatus={
                  seat.claimedByPlayer
                    ? onlineSeatIds.has(seat.id)
                      ? "online"
                      : "offline"
                    : undefined
                }
                onSelect={() => undefined}
                onRename={() => undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function createPublicSeat(seat: PlayerSeatView, ownSeat: Seat | null): Seat {
  return {
    id: seat.id,
    seatIndex: seat.seatIndex,
    playerName: seat.playerName ?? `Seat ${seat.seatIndex + 1}`,
    claimedByPlayer: seat.occupied,
    roleId: ownSeat?.roleId ?? null,
    alignment: ownSeat?.alignment ?? "good",
    alive: seat.alive,
    ghostVoteAvailable: seat.ghostVoteAvailable,
    isTraveller: seat.isTraveller,
    joinedAt: ownSeat?.joinedAt ?? "",
  };
}
