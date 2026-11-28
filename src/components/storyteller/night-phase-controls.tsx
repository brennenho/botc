import { ArrowLeft, ArrowRight } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GamePhase } from "@/lib/game-data/types";
import { nextPhase, phaseLabel, previousPhase } from "@/lib/game-phase";

export type PhaseControlsProps = {
  game: GamePhase;
  disabled: boolean;
  onChangePhase: (target: GamePhase) => void;
};

export function NightPhaseControls({
  game,
  disabled,
  onChangePhase,
}: PhaseControlsProps) {
  const [showStartForm, setShowStartForm] = useState(false);
  const startId = useId();
  const previous = previousPhase(game);
  const next = nextPhase(game);
  const choosingStart = !previous && showStartForm;
  return (
    <footer className="night-phase-footer">
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
            setShowStartForm(false);
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
            onClick={() => setShowStartForm(!choosingStart)}
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
