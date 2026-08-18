"use client";

import { ArrowLeft, ChevronDown, X } from "lucide-react";

import { CharacterToken } from "@/components/grimoire/character-token";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { roleById } from "@/lib/game-data";
import type { EditionId, GameToken, Seat } from "@/lib/game-data/types";
import {
  getInPlayReminderSources,
  getScriptReminderSources,
} from "@/lib/reminder-catalog";
import { getReminderKey, type ReminderDefinition } from "@/lib/reminders";

type PlayerReminderPickerProps = {
  editionId: EditionId;
  seat: Seat;
  seats: Seat[];
  gameTokens: GameToken[];
  onBack: () => void;
  onClose: () => void;
  onAddReminder: (definition: ReminderDefinition) => void;
};

export function PlayerReminderPicker({
  editionId,
  seat,
  seats,
  gameTokens,
  onBack,
  onClose,
  onAddReminder,
}: PlayerReminderPickerProps) {
  const reminders = gameTokens.filter(
    (token) => token.tokenType === "reminder",
  );
  const inPlayReminders = getInPlayReminderSources(
    seats,
    seat.id,
    gameTokens,
  ).flatMap((source) => source.definitions);
  const scriptReminders = getScriptReminderSources(editionId).flatMap(
    (source) => source.definitions,
  );
  const placedCounts = reminders.reduce((counts, reminder) => {
    const key = getReminderKey(reminder);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

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
          <strong>Add Reminder</strong>
          <span>Add to {seat.playerName}</span>
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
        {inPlayReminders.length > 0 ? (
          <PlayerReminderSection
            label="In-Play Reminders"
            definitions={inPlayReminders}
            placedCounts={placedCounts}
            onAddReminder={onAddReminder}
          />
        ) : (
          <p className="player-reminder-empty">
            Assign characters to make their reminders available here.
          </p>
        )}
        {scriptReminders.length > 0 && (
          <details className="player-reminder-collapsible">
            <summary>
              <span className="utility-label">All Script Reminders</span>
              <small>{scriptReminders.length}</small>
              <ChevronDown aria-hidden="true" />
            </summary>
            <PlayerReminderSection
              definitions={scriptReminders}
              placedCounts={placedCounts}
              onAddReminder={onAddReminder}
            />
          </details>
        )}
      </div>
    </>
  );
}

function PlayerReminderSection({
  label,
  definitions,
  placedCounts,
  onAddReminder,
}: {
  label?: string;
  definitions: ReminderDefinition[];
  placedCounts: Map<string, number>;
  onAddReminder: (definition: ReminderDefinition) => void;
}) {
  return (
    <section className="player-reminder-section">
      {label && <span className="utility-label">{label}</span>}
      <div className="player-reminder-grid">
        {definitions.map((definition) => {
          const sourceRole = definition.roleId
            ? roleById.get(definition.roleId)
            : null;
          if (!sourceRole) return null;

          const placed = placedCounts.get(definition.key) ?? 0;
          return (
            <Button
              key={definition.key}
              type="button"
              size="sm"
              variant="quiet"
              focusStyle="surface"
              className="tactile-action"
              aria-label={`Add ${definition.label}`}
              onClick={() => onAddReminder(definition)}
            >
              <span className="player-reminder-token-wrap">
                <CharacterToken
                  role={sourceRole}
                  size="lg"
                  className="tactile-surface"
                />
                {placed > 0 && (
                  <span className="player-reminder-count">{placed}</span>
                )}
              </span>
              <span className="player-reminder-label">
                {definition.label}
                {Number.isFinite(definition.copies) &&
                  definition.copies > 1 && (
                    <small aria-label={`${definition.copies} copies`}>
                      ×{definition.copies}
                    </small>
                  )}
              </span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
