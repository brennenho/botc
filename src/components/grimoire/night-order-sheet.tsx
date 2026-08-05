"use client";

import { useMemo } from "react";
import { Check, Moon, Sun } from "lucide-react";

import { RoleArtwork } from "@/components/grimoire/role-artwork";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  getNightOrderEntries,
  type EditionId,
  type NightOrderEntry,
} from "@/lib/game-data";
import type { Seat } from "@/lib/game-data/types";
import {
  getNightOrderViewKey,
  type NightOrderState,
} from "@/lib/night-order-state";
import { cn } from "@/lib/utils";

type DisplayEntry = NightOrderEntry & { key: string; playerName?: string };

export function NightOrderPanel({
  editionId,
  seats,
  state,
  onStateChange,
}: {
  editionId: EditionId;
  seats: Seat[];
  state: NightOrderState;
  onStateChange: (state: NightOrderState) => void;
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
            { value: "first", label: "First night" },
            { value: "other", label: "Other nights" },
          ]}
          onChange={(value) => onStateChange({ ...state, night: value })}
        />
        <SegmentedControl
          value={scope}
          label="Characters shown"
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
            <button
              key={entry.key}
              type="button"
              className={cn("night-order-row", done && "is-complete")}
              onClick={() => toggleComplete(entry.key)}
            >
              <span className="night-order-index">
                {done ? <Check className="size-3.5" /> : index + 1}
              </span>
              {entry.role ? (
                <RoleArtwork role={entry.role} size="tiny" />
              ) : (
                <span className="night-system-icon">
                  {entry.id === "dawn" ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                </span>
              )}
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
                  {entry.reminder}
                </span>
              </span>
            </button>
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
