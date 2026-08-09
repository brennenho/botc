"use client";

import { useMemo } from "react";
import { Check, Moon, Sun } from "lucide-react";

import { ReminderToken } from "@/components/grimoire/reminder-token";
import { TokenIcon } from "@/components/grimoire/token-icon";
import { SegmentedControl } from "@/components/ui/segmented-control";
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

type DisplayEntry = NightOrderEntry & { key: string; playerName?: string };

export function NightOrderPanel({
  editionId,
  seats,
  gameTokens,
  state,
  onStateChange,
  onPlaceReminder,
}: {
  editionId: EditionId;
  seats: Seat[];
  gameTokens: GameToken[];
  state: NightOrderState;
  onStateChange: (state: NightOrderState) => void;
  onPlaceReminder: (
    role: NonNullable<NightOrderEntry["role"]>,
    action: NightOrderEntry["reminderActions"][number],
  ) => void;
}) {
  const { night, scope } = state;
  const viewKey = getNightOrderViewKey(night, scope);
  const completed = useMemo(
    () => new Set(state.completed[viewKey] ?? []),
    [state.completed, viewKey],
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
                <TokenIcon role={entry.role}>
                  {entry.id === "dawn" ? <Sun /> : <Moon />}
                </TokenIcon>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-sm font-semibold">
                    {entry.name}
                    {entry.playerName && (
                      <small className="ml-1.5 font-normal text-black/42">
                        {entry.playerName}
                      </small>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-black/48">
                    <FormattedNightText text={entry.reminder} />
                  </span>
                </span>
              </button>
              {entry.role && entry.reminderActions.length > 0 && (
                <div className="night-reminder-actions">
                  {entry.reminderActions.map((action) => {
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
                        aria-label={action.instruction}
                        onClick={() =>
                          entry.role && onPlaceReminder(entry.role, action)
                        }
                      >
                        <ReminderToken
                          label={action.label}
                          roleId={entry.role?.id ?? null}
                          size="inline"
                          count={action.count}
                        />
                        <span>{action.instruction}</span>
                        {placedCount > 0 && <small>{placedCount} Placed</small>}
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
