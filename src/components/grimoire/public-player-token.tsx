"use client";

import {
  PlayerTokenView,
  StaticPlayerTokenName,
} from "@/components/grimoire/player-token";
import { createPublicPlayerTokenModel } from "@/components/grimoire/player-token-model";
import type { PlayerPresenceStatus } from "@/components/grimoire/player-presence-dot";
import type { PlayerSeatView, Seat } from "@/lib/game-data/types";
import type { ReminderLabelSide } from "@/lib/reminder-layout";

export function PublicPlayerToken({
  seat,
  ownSeat,
  tokenSize,
  labelSide,
  redacted,
  presenceStatus,
}: {
  seat: PlayerSeatView;
  ownSeat: Seat;
  tokenSize: number;
  labelSide: ReminderLabelSide;
  redacted: boolean;
  presenceStatus?: PlayerPresenceStatus;
}) {
  const model = createPublicPlayerTokenModel(seat, ownSeat);
  const isOwnSeat = seat.id === ownSeat.id;

  return (
    <PlayerTokenView
      model={model}
      selected={false}
      tokenSize={tokenSize}
      labelSide={labelSide}
      redacted={redacted}
      variant="public"
      isOwnSeat={isOwnSeat}
      presenceStatus={presenceStatus}
      readOnly
      nameControl={
        <StaticPlayerTokenName
          name={
            model.claimedByPlayer
              ? model.playerName
              : `Seat ${model.seatIndex + 1}`
          }
          presenceStatus={presenceStatus}
        />
      }
    />
  );
}
