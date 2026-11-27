import { ArrowLeft, ArrowRight, History } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GameEvent, GamePhase } from "@/lib/game-data/types";
import {
  nextPhase,
  phaseHistoryLabel,
  phaseLabel,
  previousPhase,
} from "@/lib/game-phase";

export type NightPhaseProps = {
  game: GamePhase;
  events: GameEvent[];
  disabled: boolean;
  onChangePhase: (target: GamePhase) => void;
};

export function NightPhaseControls({
  game,
  events,
  disabled,
  onChangePhase,
}: NightPhaseProps) {
  const [expanded, setExpanded] = useState<"history" | "start" | null>(null);
  const historyId = useId();
  const startId = useId();
  const previous = previousPhase(game);
  const next = nextPhase(game);
  const choosingStart = !previous && expanded === "start";
  return (
    <footer className="night-phase-footer">
      <div
        id={historyId}
        hidden={expanded !== "history"}
        className="night-phase-drawer"
      >
        {events.length ? (
          <ol
            aria-label="Phase history"
            className="divide-y divide-[var(--control-border)]"
          >
            {events.map((event, index) => (
              <li
                key={`${event.gameVersion}-${event.ordinal}`}
                className="px-4 py-2 text-sm"
              >
                {phaseHistoryLabel(event, events[index + 1])}
              </li>
            ))}
          </ol>
        ) : (
          <p className="px-4 py-3 text-sm text-[var(--ink-muted)]">
            No phases recorded yet.
          </p>
        )}
      </div>
      {!previous && (
        <form
          id={startId}
          hidden={!choosingStart}
          className="night-start-form"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            onChangePhase({
              phase: data.get("phase") === "day" ? "day" : "night",
              dayNumber: Number(data.get("number")),
            });
            setExpanded(null);
          }}
        >
          <label>
            Phase
            <select name="phase">
              <option value="night">Night</option>
              <option value="day">Day</option>
            </select>
          </label>
          <label>
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
        </form>
      )}
      <div className="night-phase-actions">
        <Button
          variant={expanded === "history" ? "tinted" : "quiet"}
          aria-expanded={expanded === "history"}
          aria-controls={historyId}
          onClick={() => setExpanded(expanded === "history" ? null : "history")}
        >
          <History aria-hidden="true" className="size-4" />
          History
        </Button>
        {previous ? (
          <Button
            variant="quiet"
            onClick={(event) => {
              if (event.detail <= 1) onChangePhase(previous);
            }}
            disabled={disabled}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to {phaseLabel(previous)}
          </Button>
        ) : (
          <Button
            variant="quiet"
            aria-expanded={choosingStart}
            aria-controls={startId}
            onClick={() => setExpanded(choosingStart ? null : "start")}
          >
            {choosingStart ? "Cancel" : "Start mid-game"}
          </Button>
        )}
        {choosingStart ? (
          <Button form={startId} type="submit" disabled={disabled}>
            Start tracking
          </Button>
        ) : (
          <Button
            disabled={disabled}
            onClick={(event) => {
              if (event.detail <= 1) onChangePhase(next);
            }}
          >
            Begin {phaseLabel(next)}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        )}
      </div>
    </footer>
  );
}
