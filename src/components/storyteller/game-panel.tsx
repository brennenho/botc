import { Tabs } from "@base-ui/react/tabs";
import { Flag, Moon, Sun, Undo2 } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { NightOrderPanel } from "@/components/storyteller/night-order-sheet";
import {
  NightPhaseControls,
  type PhaseControlsProps,
} from "@/components/storyteller/night-phase-controls";
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
  const [view, setView] = useState("night");

  return (
    <Tabs.Root
      className="sheet-panel"
      value={view}
      onValueChange={(value: unknown) => {
        if (value !== "night" && value !== "history") return;
        if (nightOrder.pendingReminder) nightOrder.onCancelReminderPlacement();
        setView(value);
      }}
    >
      <Tabs.List
        className="game-view-tabs"
        aria-label="Game views"
        activateOnFocus
      >
        <Tabs.Tab value="night">Night order</Tabs.Tab>
        <Tabs.Tab value="history">History</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="night" className="sheet-panel" keepMounted>
        <NightOrderPanel
          {...nightOrder}
          shortcutsEnabled={shortcutsEnabled && view === "night"}
        />
        <NightPhaseControls {...phaseControls} />
      </Tabs.Panel>
      <Tabs.Panel value="history" className="min-h-0 flex-1 overflow-y-auto">
        <GameHistory events={events} />
      </Tabs.Panel>
    </Tabs.Root>
  );
}
