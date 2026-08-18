"use client";

import { useMemo } from "react";
import { Check, Moon, Plus, Sun, X } from "lucide-react";

import { InformationTokenIcon } from "@/components/storyteller/information-token-icon";
import { ReminderIcon } from "@/components/storyteller/reminder-icon";
import { RevealIcon } from "@/components/storyteller/reveal-icon";
import { TokenIcon } from "@/components/storyteller/token-icon";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import {
  getNightOrderEntries,
  type EditionId,
  type NightOrderEntry,
} from "@/lib/game-data";
import type { GameToken, Seat } from "@/lib/game-data/types";
import {
  getNightOrderViewKey,
  type NightOrderState,
} from "@/lib/night-order-state";
import { cn } from "@/lib/utils";
import type { ReminderDefinition } from "@/lib/reminders";
import {
  canShowPlayerReveal,
  getNightRevealActions,
  type NightRevealAction,
} from "@/lib/player-reveal";

type DisplayEntry = NightOrderEntry & { key: string; playerName?: string };

export function NightOrderPanel({
  shortcutsEnabled,
  editionId,
  seats,
  gameTokens,
  state,
  pendingReminder,
  onStateChange,
  onPlaceReminder,
  onCancelReminderPlacement,
  onReveal,
}: {
  shortcutsEnabled: boolean;
  editionId: EditionId;
  seats: Seat[];
  gameTokens: GameToken[];
  state: NightOrderState;
  pendingReminder: ReminderDefinition | null;
  onStateChange: (state: NightOrderState) => void;
  onPlaceReminder: (
    role: NonNullable<NightOrderEntry["role"]>,
    action: NightOrderEntry["reminderActions"][number],
  ) => void;
  onCancelReminderPlacement: () => void;
  onReveal: (action: NightRevealAction) => void;
}) {
  const { night, scope } = state;
  const viewKey = getNightOrderViewKey(night, scope);
  const completed = useMemo(
    () => new Set(state.completed[viewKey] ?? []),
    [state.completed, viewKey],
  );

  useKeyboardShortcuts(
    [
      {
        id: "show-first-night",
        key: "1",
        onTrigger: () => onStateChange({ ...state, night: "first" }),
      },
      {
        id: "show-other-nights",
        key: "2",
        onTrigger: () => onStateChange({ ...state, night: "other" }),
      },
      {
        id: "show-living-characters",
        key: "l",
        onTrigger: () => onStateChange({ ...state, scope: "alive" }),
      },
      {
        id: "show-all-characters",
        key: "a",
        onTrigger: () => onStateChange({ ...state, scope: "all" }),
      },
    ],
    shortcutsEnabled,
  );

  const entries = useMemo(() => {
    const order = getNightOrderEntries(editionId, night);
    if (scope === "all") {
      return order.map((entry): DisplayEntry => ({ ...entry, key: entry.id }));
    }

    return order.flatMap((entry): DisplayEntry[] => {
      if (entry.system) return [{ ...entry, key: entry.id }];
      const matchingSeats = seats.filter(
        (seat) => seat.alive && seat.roleId === entry.role?.id,
      );
      return matchingSeats.map((seat) => ({
        ...entry,
        key: `${entry.id}-${seat.id}`,
        playerName: seat.playerName,
      }));
    });
  }, [editionId, night, scope, seats]);

  function toggleComplete(key: string) {
    const next = new Set(completed);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onStateChange({
      ...state,
      completed: {
        ...state.completed,
        [viewKey]: [...next],
      },
    });
  }

  return (
    <>
      <div className="night-controls">
        <SegmentedControl
          value={night}
          label="Night"
          className="flex-1"
          options={[
            { value: "first", label: "First Night" },
            { value: "other", label: "Other Nights" },
          ]}
          onChange={(value) => onStateChange({ ...state, night: value })}
        />
        <SegmentedControl
          value={scope}
          label="Characters Shown"
          className="flex-1"
          options={[
            { value: "alive", label: "Alive" },
            { value: "all", label: "All" },
          ]}
          onChange={(value) => onStateChange({ ...state, scope: value })}
        />
      </div>

      <div className="night-order-list">
        {entries.map((entry, index) => {
          const done = completed.has(entry.key);
          const revealActions = getNightRevealActions(entry);
          return (
            <div
              key={entry.key}
              className={cn("night-order-row", done && "is-complete")}
            >
              <button
                type="button"
                className="night-order-row-main"
                onClick={() => toggleComplete(entry.key)}
              >
                <span className="night-order-index">
                  {done ? <Check className="size-3.5" /> : index + 1}
                </span>
                <TokenIcon
                  role={entry.role}
                  className={cn(
                    (entry.id === "minioninfo" || entry.id === "demoninfo") &&
                      "night-order-information-token",
                  )}
                >
                  <NightOrderSystemIcon entryId={entry.id} />
                </TokenIcon>
                <span className="night-order-copy">
                  <span className="night-order-title">
                    {entry.name}
                    {entry.playerName && (
                      <small className="night-order-player">
                        {entry.playerName}
                      </small>
                    )}
                  </span>
                  <span className="night-order-description">
                    <FormattedNightText text={entry.reminder} />
                  </span>
                </span>
              </button>
              {entry.role && entry.reminderActions.length > 0 && (
                <div className="night-reminder-actions">
                  {entry.reminderActions.map((action) => {
                    const active =
                      pendingReminder?.roleId === entry.role?.id &&
                      pendingReminder?.label === action.label;
                    const placedCount = gameTokens.filter(
                      (token) =>
                        token.tokenType === "reminder" &&
                        token.roleId === entry.role?.id &&
                        token.label === action.label,
                    ).length;
                    return (
                      <button
                        key={`${entry.key}-${action.label}`}
                        type="button"
                        className={cn(active && "is-active")}
                        aria-label={
                          active
                            ? `Cancel Placing ${action.label}`
                            : `${action.instruction}${
                                placedCount > 0 ? `, ${placedCount} Placed` : ""
                              }`
                        }
                        aria-pressed={active}
                        onClick={() => {
                          if (active) {
                            onCancelReminderPlacement();
                            return;
                          }
                          if (entry.role) onPlaceReminder(entry.role, action);
                        }}
                      >
                        <span className="night-reminder-action-icon">
                          <ReminderIcon />
                          {placedCount > 0 && (
                            <small aria-hidden="true">{placedCount}</small>
                          )}
                        </span>
                        <span className="night-reminder-action-copy">
                          {action.instruction}
                        </span>
                        <span className="night-reminder-action-meta">
                          {active ? <X /> : <Plus />}
                          <strong>{active ? "Cancel" : "Place"}</strong>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {revealActions.length > 0 && (
                <div className="night-reveal-actions">
                  {revealActions.map((action) => {
                    const disabled =
                      action.kind === "reveal" &&
                      !canShowPlayerReveal(action.reveal, gameTokens);

                    return (
                      <button
                        key={`${entry.key}-${action.id}`}
                        type="button"
                        disabled={disabled}
                        onClick={() => onReveal(action)}
                      >
                        <span className="night-reveal-action-icon">
                          <RevealIcon />
                        </span>
                        <span className="night-reveal-action-copy">
                          {action.label}
                        </span>
                        <span className="night-reveal-action-meta">
                          <strong>Show</strong>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {entries.length === 0 && (
          <div className="night-empty">
            <Moon className="mx-auto mb-3 size-5 text-black/30" />
            <p>No living characters act this night.</p>
          </div>
        )}
      </div>
    </>
  );
}

function NightOrderSystemIcon({ entryId }: { entryId: string }) {
  if (entryId === "minioninfo") {
    return <InformationTokenIcon type="minions" />;
  }
  if (entryId === "demoninfo") {
    return <InformationTokenIcon type="demon" />;
  }
  return entryId === "dawn" ? <Sun /> : <Moon />;
}

function FormattedNightText({ text }: { text: string }) {
  return text.split(/(\*[^*]+\*)/g).map((part, index) =>
    part.startsWith("*") && part.endsWith("*") ? (
      <strong key={`${part}-${index}`} className="night-info-token">
        {part.slice(1, -1)}
      </strong>
    ) : (
      part
    ),
  );
}
