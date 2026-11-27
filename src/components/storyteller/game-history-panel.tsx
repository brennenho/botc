import { Clock, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GameEvent, GamePhase } from "@/lib/game-data/types";
import { nextPhase, phaseLabel } from "@/lib/game-phase";

export type GameHistoryProps = {
  game: GamePhase;
  events: GameEvent[];
  disabled: boolean;
  onBegin: (target: GamePhase) => void;
};

export function GameHistoryPanel({
  game,
  events,
  disabled,
  onBegin,
}: GameHistoryProps) {
  const next = nextPhase(game);
  return (
    <div className="sheet-panel overflow-y-auto">
      <div className="grid gap-3 border-b border-black/10 p-4">
        <div className="flex items-center justify-between gap-2">
          <strong>{phaseLabel(game)}</strong>
          <Button
            disabled={disabled}
            onClick={(event) => {
              if (event.detail <= 1) onBegin(next);
            }}
          >
            Begin {phaseLabel(next)}
          </Button>
        </div>
        {game.phase === "setup" && (
          <details>
            <summary className="cursor-pointer text-sm">Start mid-game</summary>
            <form
              className="mt-2 flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                onBegin({
                  phase: data.get("phase") === "day" ? "day" : "night",
                  dayNumber: Number(data.get("number")),
                });
              }}
            >
              <label className="grid text-sm">
                Phase
                <select className="h-10" name="phase">
                  <option value="night">Night</option>
                  <option value="day">Day</option>
                </select>
              </label>
              <label className="grid text-sm">
                Number
                <Input
                  className="w-20"
                  name="number"
                  type="number"
                  min="1"
                  max="2147483646"
                  required
                  defaultValue="1"
                />
              </label>
              <Button type="submit" variant="secondary" disabled={disabled}>
                Start tracking
              </Button>
            </form>
          </details>
        )}
      </div>
      {events.length ? (
        <ol
          aria-label="Phase history"
          className="divide-y divide-black/10 px-4"
        >
          {events.map((event) => {
            const Icon =
              event.phase === "night"
                ? Moon
                : event.phase === "day"
                  ? Sun
                  : Clock;
            return (
              <li
                key={`${event.gameVersion}-${event.ordinal}`}
                className="flex items-center gap-3 py-3"
              >
                <Icon aria-hidden="true" className="size-4" />
                {phaseLabel(event)} began
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="p-4 text-sm text-[var(--ink-muted)]">
          No phases recorded yet.
        </p>
      )}
    </div>
  );
}
