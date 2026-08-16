"use client";

import { useRef } from "react";

import { PublicPlayerToken } from "@/components/grimoire/public-player-token";
import { useTownCircleLayout } from "@/hooks/use-town-circle-layout";
import type { PlayerSeatView, Seat } from "@/lib/game-data/types";
import { getGrimoirePlayerTokenSize } from "@/lib/grimoire-canvas";
import { getPlayerLabelSide } from "@/lib/reminder-layout";
import { cn } from "@/lib/utils";

const PLAYER_BOARD_INSETS = { top: 86, right: 0, bottom: 10, left: 0 };

export function ReadOnlyGrimoireBoard({
  seats,
  ownSeat,
  onlineSeatIds,
  presenceAvailable,
  redacted,
}: {
  seats: PlayerSeatView[];
  ownSeat: Seat;
  onlineSeatIds: ReadonlySet<string>;
  presenceAvailable: boolean;
  redacted: boolean;
}) {
  const orderedSeats = [...seats].sort((a, b) => a.seatIndex - b.seatIndex);
  const boardRef = useRef<HTMLDivElement>(null);
  const { compact, layout } = useTownCircleLayout(
    boardRef,
    orderedSeats.length,
    PLAYER_BOARD_INSETS,
  );
  const tokenSize = compact
    ? layout.tokenSize
    : getGrimoirePlayerTokenSize(orderedSeats.length);

  return (
    <div className="grimoire-frame player-grimoire-frame">
      <div
        ref={boardRef}
        className={cn(
          "grimoire-board player-grimoire-canvas",
          compact && "is-compact-layout",
        )}
        data-layout-density={compact ? layout.density : undefined}
        aria-label="Town Seating"
      >
        {orderedSeats.map((seatView, index) => {
          const position = compact
            ? (layout.positions[index] ?? seatView.position)
            : seatView.position;
          const labelSide = getPlayerLabelSide({
            playerPosition: position,
          });

          return (
            <div
              key={seatView.id}
              className="canvas-player-position"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
              }}
            >
              <PublicPlayerToken
                seat={seatView}
                ownSeat={ownSeat}
                tokenSize={tokenSize}
                labelSide={labelSide}
                redacted={redacted}
                presenceStatus={
                  presenceAvailable && seatView.occupied
                    ? onlineSeatIds.has(seatView.id)
                      ? "online"
                      : "offline"
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
