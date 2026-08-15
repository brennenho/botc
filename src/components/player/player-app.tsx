"use client";

import { AlertCircle, BookOpen, RotateCcw } from "lucide-react";
import { useState } from "react";

import { CharacterSheet } from "@/components/character-sheet/character-sheet";
import { GrimoirePanelTabs } from "@/components/grimoire/grimoire-panel-tabs";
import { GrimoireToolbar } from "@/components/grimoire/grimoire-toolbar";
import { PlayerRoleCard } from "@/components/player/player-role-card";
import { ReadOnlyGrimoireBoard } from "@/components/player/read-only-grimoire-board";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
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
  const { snapshot, loading, error, refresh } = usePlayerGame(gameCode, seatId);
  const onlineSeatIds = useGamePresence(gameCode, seatId);
  const [redacted, setRedacted] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);

  if (loading) return <PlayerLoading />;
  if (error || !snapshot) {
    return <PlayerError message={error} onRetry={() => void refresh()} />;
  }

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
        onRedactedChange={(nextRedacted) => {
          setRedacted(nextRedacted);
          if (nextRedacted) setScriptOpen(false);
        }}
      />

      <div className="grimoire-workspace">
        <ReadOnlyGrimoireBoard
          seats={snapshot.seats}
          ownSeat={snapshot.seat}
          onlineSeatIds={onlineSeatIds}
          redacted={redacted}
        />
      </div>

      {!redacted && (
        <>
          <GrimoirePanelTabs
            sheetOpen={scriptOpen}
            tabs={[
              {
                id: "script",
                icon: <BookOpen />,
                label: "Script",
                active: scriptOpen,
                onClick: () => setScriptOpen((current) => !current),
              },
            ]}
          />
          <Sheet
            open={scriptOpen}
            onOpenChange={setScriptOpen}
            title="Character Sheet"
            modal={false}
            backdrop={false}
            disablePointerDismissal
            className="character-sheet-side-sheet max-[700px]:!w-screen max-[700px]:!max-w-none max-[700px]:!basis-full"
          >
            <CharacterSheet editionId={snapshot.game.edition} />
          </Sheet>
        </>
      )}

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
      <div role="status" aria-live="polite">
        <div
          className="size-6 animate-spin rounded-full border-2 border-black/15 border-t-black/60"
          aria-hidden="true"
        />
        <span className="sr-only">Loading player grimoire</span>
      </div>
    </main>
  );
}

function PlayerError({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <main className="grimoire-error-screen">
      <div>
        <AlertCircle className="mx-auto mb-4 size-7 text-red-300/80" />
        <h1 className="font-display text-3xl">Unable to Load Your Game</h1>
        <p>{message ?? "The player grimoire could not be loaded."}</p>
        <div className="grimoire-error-actions">
          <Button variant="secondary" onClick={onRetry}>
            <RotateCcw className="size-4" />
            Try Again
          </Button>
          <Button
            className="text-white/60 hover:bg-white/8 hover:text-white"
            variant="quiet"
            onClick={() => window.location.assign("/")}
          >
            Back Home
          </Button>
        </div>
      </div>
    </main>
  );
}
