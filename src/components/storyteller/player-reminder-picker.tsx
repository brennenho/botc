"use client";

import { ArrowLeft, X } from "lucide-react";

import { PlayerReminderGrid } from "@/components/storyteller/player-reminder-grid";
import { IconButton } from "@/components/ui/icon-button";
import type { EditionId, GameToken } from "@/lib/game-data/types";
import { getScriptReminderSources } from "@/lib/reminder-catalog";
import type { ReminderDefinition } from "@/lib/reminders";

type PlayerReminderPickerProps = {
  editionId: EditionId;
  playerName: string;
  gameTokens: GameToken[];
  onBack: () => void;
  onClose: () => void;
  onAddReminder: (definition: ReminderDefinition) => void;
};

export function PlayerReminderPicker({
  editionId,
  playerName,
  gameTokens,
  onBack,
  onClose,
  onAddReminder,
}: PlayerReminderPickerProps) {
  const scriptReminders = getScriptReminderSources(editionId).flatMap(
    (source) => source.definitions,
  );

  return (
    <>
      <header className="player-menu-header reminder-menu-header">
        <IconButton
          label="Back"
          shortcut="B"
          size="sm"
          variant="quiet"
          tooltipSide="bottom"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
        </IconButton>
        <div className="player-menu-identity">
          <strong>All Script Reminders</strong>
          <span>Add to {playerName}</span>
        </div>
        <IconButton
          label="Close Player Controls"
          size="sm"
          variant="quiet"
          tooltip={false}
          onClick={onClose}
        >
          <X className="size-4" />
        </IconButton>
      </header>

      <div className="player-reminder-menu">
        <section className="player-reminder-section">
          <PlayerReminderGrid
            definitions={scriptReminders}
            gameTokens={gameTokens}
            playerName={playerName}
            onAddReminder={onAddReminder}
          />
        </section>
      </div>
    </>
  );
}
