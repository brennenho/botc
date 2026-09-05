"use client";

import { ReminderTokenAction } from "@/components/storyteller/reminder-token-action";
import type { GameToken } from "@/lib/game-data/types";
import {
  getReminderCopyLimit,
  getReminderKey,
  type ReminderDefinition,
} from "@/lib/reminders";

export function PlayerReminderGrid({
  definitions,
  gameTokens,
  targetSeatId,
  playerName,
  onAddReminder,
}: {
  definitions: ReminderDefinition[];
  gameTokens: GameToken[];
  targetSeatId: string;
  playerName: string;
  onAddReminder: (definition: ReminderDefinition) => void;
}) {
  const placedCounts = gameTokens.reduce((counts, token) => {
    if (token.tokenType !== "reminder") return counts;
    const key = getReminderKey(token);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  const targetPlacedCounts = gameTokens.reduce((counts, token) => {
    if (token.tokenType !== "reminder" || token.seatId !== targetSeatId) {
      return counts;
    }
    const key = getReminderKey(token);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  return (
    <div className="player-reminder-grid">
      {definitions.map((definition) => {
        const placed = placedCounts.get(definition.key) ?? 0;
        const copyLimit = getReminderCopyLimit(definition);
        const placedOnTarget = targetPlacedCounts.get(definition.key) ?? 0;
        const atCapacity = placed >= copyLimit;
        const alreadyOnTarget = atCapacity && placedOnTarget >= copyLimit;
        const actionLabel = alreadyOnTarget
          ? `${definition.label} reminder already on ${playerName}`
          : `${atCapacity ? "Move" : "Add"} ${definition.label} reminder to ${playerName}`;
        return (
          <ReminderTokenAction
            key={definition.key}
            className="player-reminder-action"
            actionLabel={actionLabel}
            reminderLabel={definition.label}
            roleId={definition.roleId}
            tokenSize={48}
            count={placed > 0 ? placed : undefined}
            showSingleCount
            caption={
              <>
                {definition.label}
                {Number.isFinite(definition.copies) &&
                  definition.copies > 1 && <small>×{definition.copies}</small>}
              </>
            }
            disabled={alreadyOnTarget}
            onClick={() => onAddReminder(definition)}
          />
        );
      })}
    </div>
  );
}
