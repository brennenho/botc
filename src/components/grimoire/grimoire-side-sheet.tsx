"use client";

import { RotateCcw } from "lucide-react";

import { NightOrderPanel } from "@/components/grimoire/night-order-sheet";
import { RosterPanel } from "@/components/grimoire/roster-sheet";
import { IconButton } from "@/components/ui/icon-button";
import { Sheet } from "@/components/ui/sheet";
import { usePersistedNightOrderState } from "@/hooks/use-persisted-night-order-state";
import type { EditionId, Seat } from "@/lib/game-data/types";
import { cn } from "@/lib/utils";

export type GrimoirePanel = "players" | "night" | null;

export function GrimoireSideSheet({
  panel,
  gameId,
  editionId,
  seats,
  onClose,
  onSelectSeat,
  onChooseRole,
  onClearRole,
  onRemovePlayer,
  onRename,
  onAddPlayer,
  onDistributeRoles,
  onClearAssignments,
  onArrangeCircle,
}: {
  panel: GrimoirePanel;
  gameId: string;
  editionId: EditionId;
  seats: Seat[];
  onClose: () => void;
  onSelectSeat: (seatId: string) => void;
  onChooseRole: (seatId: string) => void;
  onClearRole: (seatId: string) => void;
  onRemovePlayer: (seatId: string) => void;
  onRename: (seatId: string, name: string) => void;
  onAddPlayer: () => void;
  onDistributeRoles: (roleIds: string[]) => void;
  onClearAssignments: () => void;
  onArrangeCircle: () => void;
}) {
  const [nightOrderState, setNightOrderState] =
    usePersistedNightOrderState(gameId);

  return (
    <Sheet
      open={panel !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={panel === "night" ? "Night order" : "Players"}
      eyebrow={panel === "night" ? "Storyteller" : undefined}
      className={cn(panel === "night" && "night-sheet")}
      headerActions={
        panel === "players" ? (
          <IconButton
            label="Arrange players in a circle"
            variant="quiet"
            onClick={onArrangeCircle}
          >
            <RotateCcw className="size-4" />
          </IconButton>
        ) : null
      }
    >
      <div className="sheet-panel" hidden={panel !== "players"}>
        <RosterPanel
          editionId={editionId}
          seats={seats}
          onClose={onClose}
          onSelectSeat={onSelectSeat}
          onChooseRole={onChooseRole}
          onClearRole={onClearRole}
          onRemovePlayer={onRemovePlayer}
          onRename={onRename}
          onAddPlayer={onAddPlayer}
          onDistributeRoles={onDistributeRoles}
          onClearAssignments={onClearAssignments}
        />
      </div>
      <div className="sheet-panel" hidden={panel !== "night"}>
        <NightOrderPanel
          editionId={editionId}
          seats={seats}
          state={nightOrderState}
          onStateChange={setNightOrderState}
        />
      </div>
    </Sheet>
  );
}
