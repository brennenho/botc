"use client";

import { CharacterToken } from "@/components/grimoire/character-token";
import { Button } from "@/components/ui/button";
import { roleById } from "@/lib/game-data";
import type { GameToken } from "@/lib/game-data/types";
import { getReminderKey, type ReminderDefinition } from "@/lib/reminders";

export function PlayerReminderGrid({
  definitions,
  gameTokens,
  playerName,
  onAddReminder,
}: {
  definitions: ReminderDefinition[];
  gameTokens: GameToken[];
  playerName: string;
  onAddReminder: (definition: ReminderDefinition) => void;
}) {
  const placedCounts = gameTokens.reduce((counts, token) => {
    if (token.tokenType !== "reminder") return counts;
    const key = getReminderKey(token);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  return (
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
            aria-label={`Add ${definition.label} reminder to ${playerName}`}
            onClick={() => onAddReminder(definition)}
          >
            <span className="player-reminder-token-wrap">
              <CharacterToken role={sourceRole} size="lg" />
              {placed > 0 && (
                <span className="player-reminder-count">{placed}</span>
              )}
            </span>
            <span className="player-reminder-label">
              {definition.label}
              {Number.isFinite(definition.copies) && definition.copies > 1 && (
                <small aria-label={`${definition.copies} copies`}>
                  ×{definition.copies}
                </small>
              )}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
