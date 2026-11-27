"use client";

import { Pin } from "lucide-react";

import {
  CharacterReference,
  type CharacterReferenceView,
} from "@/components/character-sheet/character-reference";
import { NightOrderPanel } from "@/components/storyteller/night-order-sheet";
import {
  GameHistoryPanel,
  type GameHistoryProps,
} from "@/components/storyteller/game-history-panel";
import { PlayerRevealPanel } from "@/components/storyteller/player-reveal-panel";
import { RosterPanel } from "@/components/storyteller/roster-sheet";
import { IconButton } from "@/components/ui/icon-button";
import { Sheet } from "@/components/ui/sheet";
import type { NightReminderAction } from "@/lib/game-data/night-reminder-actions";
import type { GameScript, GameToken, Role, Seat } from "@/lib/game-data/types";
import type { NightOrderState } from "@/lib/night-order-state";
import type { ReminderDefinition } from "@/lib/reminders";
import type { NightRevealAction, PlayerReveal } from "@/lib/player-reveal";
import { cn } from "@/lib/utils";

const panelTitles = {
  players: "Players",
  night: "Night Order",
  info: "Player Information",
  script: "Character Reference",
  history: "Game history",
};
export type GrimoirePanel = keyof typeof panelTitles | null;

export function GrimoireSideSheet({
  panel,
  history,
  shortcutsEnabled,
  editionId,
  seats,
  gameTokens,
  pinned,
  suspended,
  pendingReminder,
  referenceView,
  nightOrderState,
  onNightOrderStateChange,
  onPinnedChange,
  onReferenceViewChange,
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
  onCancelReminderPlacement,
  onNightReveal,
  onReveal,
  onChooseRevealRole,
}: {
  panel: GrimoirePanel;
  history: GameHistoryProps;
  shortcutsEnabled: boolean;
  editionId: GameScript;
  seats: Seat[];
  gameTokens: GameToken[];
  pinned: boolean;
  suspended: boolean;
  pendingReminder: ReminderDefinition | null;
  referenceView: CharacterReferenceView;
  nightOrderState: NightOrderState;
  onNightOrderStateChange: (state: NightOrderState) => void;
  onPinnedChange: (pinned: boolean) => void;
  onReferenceViewChange: (view: CharacterReferenceView) => void;
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
  onCancelReminderPlacement: () => void;
  onNightReveal: (action: NightRevealAction) => void;
  onReveal: (reveal: PlayerReveal) => void;
  onChooseRevealRole: (heading: string) => void;
}) {
  return (
    <Sheet
      open={panel !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={panelTitles[panel ?? "players"]}
      suspended={suspended}
      modal={false}
      backdrop={false}
      disablePointerDismissal
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
      {panel === "history" && <GameHistoryPanel {...history} />}
      <div className="sheet-panel" hidden={panel !== "players"}>
        <RosterPanel
          shortcutsEnabled={shortcutsEnabled && panel === "players"}
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
          shortcutsEnabled={shortcutsEnabled && panel === "night"}
          editionId={editionId}
          seats={seats}
          gameTokens={gameTokens}
          state={nightOrderState}
          pendingReminder={pendingReminder}
          onStateChange={onNightOrderStateChange}
          onPlaceReminder={onPlaceNightReminder}
          onCancelReminderPlacement={onCancelReminderPlacement}
          onReveal={onNightReveal}
        />
      </div>
      <div className="sheet-panel" hidden={panel !== "info"}>
        <PlayerRevealPanel
          seats={seats}
          gameTokens={gameTokens}
          onReveal={onReveal}
          onChooseRole={onChooseRevealRole}
        />
      </div>
      <div className="sheet-panel" hidden={panel !== "script"}>
        <CharacterReference
          editionId={editionId}
          view={referenceView}
          onViewChange={onReferenceViewChange}
        />
      </div>
    </Sheet>
  );
}
