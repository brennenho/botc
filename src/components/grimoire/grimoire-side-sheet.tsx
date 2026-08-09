"use client";

import { Pin } from "lucide-react";

import { NightOrderPanel } from "@/components/grimoire/night-order-sheet";
import { RosterPanel } from "@/components/grimoire/roster-sheet";
import { IconButton } from "@/components/ui/icon-button";
import { Sheet } from "@/components/ui/sheet";
import type { NightReminderAction } from "@/lib/game-data/night-reminder-actions";
import type { EditionId, GameToken, Role, Seat } from "@/lib/game-data/types";
import type { NightOrderState } from "@/lib/night-order-state";
import { cn } from "@/lib/utils";

export type GrimoirePanel = "players" | "night" | null;

export function GrimoireSideSheet({
  panel,
  editionId,
  seats,
  gameTokens,
  pinned,
  childDialogOpen,
  nightOrderState,
  onNightOrderStateChange,
  onPinnedChange,
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
  onPlaceNightReminder,
}: {
  panel: GrimoirePanel;
  editionId: EditionId;
  seats: Seat[];
  gameTokens: GameToken[];
  pinned: boolean;
  childDialogOpen: boolean;
  nightOrderState: NightOrderState;
  onNightOrderStateChange: (state: NightOrderState) => void;
  onPinnedChange: (pinned: boolean) => void;
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
  onPlaceNightReminder: (role: Role, action: NightReminderAction) => void;
}) {
  return (
    <Sheet
      open={panel !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={panel === "night" ? "Night Order" : "Players"}
      modal={false}
      backdrop={false}
      disablePointerDismissal={pinned || childDialogOpen}
      className={cn(panel === "night" && "night-sheet", pinned && "is-pinned")}
      headerActions={
        <IconButton
          label={pinned ? "Unpin Sheet" : "Pin Sheet"}
          variant="quiet"
          className="sheet-pin-button"
          aria-pressed={pinned}
          onClick={() => onPinnedChange(!pinned)}
        >
          <Pin className="size-4" />
        </IconButton>
      }
    >
      <div className="sheet-panel" hidden={panel !== "players"}>
        <RosterPanel
          editionId={editionId}
          seats={seats}
          gameTokens={gameTokens}
          onClose={onClose}
          onSelectSeat={onSelectSeat}
          onChooseRole={onChooseRole}
          onClearRole={onClearRole}
          onRemovePlayer={onRemovePlayer}
          onRename={onRename}
          onAddPlayer={onAddPlayer}
          onDistributeRoles={onDistributeRoles}
          onClearAssignments={onClearAssignments}
          onArrangeCircle={onArrangeCircle}
        />
      </div>
      <div className="sheet-panel" hidden={panel !== "night"}>
        <NightOrderPanel
          editionId={editionId}
          seats={seats}
          gameTokens={gameTokens}
          state={nightOrderState}
          onStateChange={onNightOrderStateChange}
          onPlaceReminder={onPlaceNightReminder}
        />
      </div>
    </Sheet>
  );
}
