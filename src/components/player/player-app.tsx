"use client";

import { BookOpen } from "lucide-react";
import { useState } from "react";

import {
  CharacterReference,
  type CharacterReferenceView,
} from "@/components/character-sheet/character-reference";
import { GrimoirePanelTabs } from "@/components/grimoire/grimoire-panel-tabs";
import { GrimoireToolbar } from "@/components/grimoire/grimoire-toolbar";
import { PlayerRoleCard } from "@/components/player/player-role-card";
import { ReadOnlyGrimoireBoard } from "@/components/player/read-only-grimoire-board";
import { PageError } from "@/components/ui/page-error";
import { Sheet } from "@/components/ui/sheet";
import { StatusNotice } from "@/components/ui/status-notice";
import { useGamePresence } from "@/hooks/use-game-presence";
import { usePlayerGame } from "@/hooks/use-player-game";
import { isTerminalGameError } from "@/lib/app-error";
import { roleById } from "@/lib/game-data";
import type { PlayerSnapshot } from "@/lib/game-data/types";
import { cn } from "@/lib/utils";

export function PlayerApp({
  gameCode,
  seatId,
  initialSnapshot,
}: {
  gameCode: string;
  seatId: string;
  initialSnapshot: PlayerSnapshot;
}) {
  const { snapshot, refreshError, isRefreshing, refresh } = usePlayerGame(
    gameCode,
    seatId,
    initialSnapshot,
  );
  const presence = useGamePresence(gameCode, seatId);
  const [redacted, setRedacted] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [referenceView, setReferenceView] =
    useState<CharacterReferenceView>("script");

  if (isTerminalGameError(refreshError)) {
    return (
      <PageError
        title="Game unavailable"
        message="This game may have ended, or this link is no longer valid."
      />
    );
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
        actorRole="player"
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
          onlineSeatIds={presence.onlineSeatIds}
          presenceAvailable={presence.status === "connected"}
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
                label: "Reference",
                active: scriptOpen,
                onClick: () => setScriptOpen((current) => !current),
              },
            ]}
          />
          <Sheet
            open={scriptOpen}
            onOpenChange={setScriptOpen}
            title="Character Reference"
            modal={false}
            backdrop={false}
            disablePointerDismissal
            className="character-sheet-side-sheet max-[700px]:!w-screen max-[700px]:!max-w-none max-[700px]:!basis-full"
          >
            <CharacterReference
              editionId={snapshot.game.edition}
              view={referenceView}
              onViewChange={setReferenceView}
            />
          </Sheet>
        </>
      )}

      <PlayerRoleCard
        role={role ?? null}
        seat={snapshot.seat}
        redacted={redacted}
      />

      {refreshError ? (
        <div className="status-notice-stack">
          <StatusNotice
            tone="connection"
            title="Connection interrupted"
            message="Showing the latest available game."
            actionLabel="Retry"
            actionPending={isRefreshing}
            onAction={() => void refresh()}
          />
        </div>
      ) : null}
    </main>
  );
}
