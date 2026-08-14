"use client";

import { notFound } from "next/navigation";
import { useState } from "react";

import { GrimoireToolbar } from "@/components/grimoire/grimoire-toolbar";
import { PlayerRoleCard } from "@/components/player/player-role-card";
import { ReadOnlyGrimoireBoard } from "@/components/player/read-only-grimoire-board";
import { useGamePresence } from "@/hooks/use-game-presence";
import { usePlayerGame } from "@/hooks/use-player-game";
import { roleById } from "@/lib/game-data";
import { cn } from "@/lib/utils";

export function PlayerApp({
  gameCode,
  seatId,
}: {
  gameCode: string;
  seatId: string;
}) {
  const { snapshot, loading, error } = usePlayerGame(gameCode, seatId);
  const onlineSeatIds = useGamePresence(gameCode, seatId);
  const [redacted, setRedacted] = useState(false);

  if (loading) return <PlayerLoading />;
  if (error || !snapshot) notFound();

  const role = snapshot.seat.roleId ? roleById.get(snapshot.seat.roleId) : null;

  return (
    <main
      className={cn(
        "storyteller-shell player-grimoire-shell",
        redacted && "is-redacted",
      )}
    >
      <GrimoireToolbar
        editionId={snapshot.game.edition}
        joinCode={snapshot.game.joinCode}
        redacted={redacted}
        onRedactedChange={setRedacted}
      />

      <div className="grimoire-workspace">
        <ReadOnlyGrimoireBoard
          seats={snapshot.seats}
          ownSeat={snapshot.seat}
          onlineSeatIds={onlineSeatIds}
          redacted={redacted}
        />
      </div>

      <PlayerRoleCard
        role={role ?? null}
        seat={snapshot.seat}
        redacted={redacted}
      />
    </main>
  );
}

function PlayerLoading() {
  return (
    <main className="home-surface grid min-h-svh place-items-center">
      <div className="size-6 animate-spin rounded-full border-2 border-black/15 border-t-black/60" />
    </main>
  );
}
