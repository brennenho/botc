import { Flag, Moon, Sun, Undo2 } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { NightOrderPanel } from "@/components/storyteller/night-order-sheet";
import {
  NightPhaseControls,
  type PhaseControlsProps,
} from "@/components/storyteller/night-phase-controls";
import { Tabs } from "@/components/ui/tabs";
import type { GameEvent } from "@/lib/game-data/types";
import { isPhaseReturn, phaseLabel } from "@/lib/game-phase";

const eventTime = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });
const historyIcons = { day: Sun, night: Moon, setup: Flag, return: Undo2 };

function GameHistory({ events }: { events: GameEvent[] }) {
  if (!events.length) {
    return (
      <p className="px-4 py-3 text-sm text-[var(--ink-muted)]">
        No game events yet.
      </p>
    );
  }

  return (
    <ol aria-label="Game history" role="list" className="game-timeline">
      {events.map((event, index) => {
        const returned = isPhaseReturn(event, events[index + 1]);
        const marker = returned ? "return" : event.phase;
        const Icon = historyIcons[marker];
        const phase = phaseLabel(event);
        return (
          <li key={`${event.gameVersion}-${event.ordinal}`}>
            <Icon
              className="game-timeline-marker"
              data-marker={marker}
              aria-hidden="true"
            />
            <div>
              <span>
                {returned ? `Returned to ${phase}` : `${phase} began`}
              </span>
              <time dateTime={event.occurredAt}>
                {eventTime.format(new Date(event.occurredAt))}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function GamePanel({
  phaseControls,
  events,
  shortcutsEnabled,
  ...nightOrder
}: ComponentProps<typeof NightOrderPanel> & {
  phaseControls: PhaseControlsProps;
  events: GameEvent[];
}) {
  const [view, setView] = useState<"night" | "history">("night");

  return (
    <Tabs
      label="Game views"
      value={view}
      onValueChange={(nextView) => {
        if (nightOrder.pendingReminder) nightOrder.onCancelReminderPlacement();
        setView(nextView);
      }}
      tabs={[
        {
          value: "night",
          label: "Night order",
          keepMounted: true,
          content: (
            <>
              <NightOrderPanel
                {...nightOrder}
                shortcutsEnabled={shortcutsEnabled && view === "night"}
              />
              <NightPhaseControls {...phaseControls} />
            </>
          ),
        },
        {
          value: "history",
          label: "History",
          content: <GameHistory events={events} />,
        },
      ]}
    />
  );
}
