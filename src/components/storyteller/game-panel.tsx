import { Tabs } from "@base-ui/react/tabs";
import { useState, type ComponentProps } from "react";

import { NightOrderPanel } from "@/components/storyteller/night-order-sheet";
import {
  NightPhaseControls,
  type PhaseControlsProps,
} from "@/components/storyteller/night-phase-controls";
import type { GameEvent } from "@/lib/game-data/types";
import { phaseHistoryLabel } from "@/lib/game-phase";

const eventTime = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });

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
        {events.length ? (
          <ol
            aria-label="Phase history"
            className="divide-y divide-[var(--control-border)]"
          >
            {events.map((event, index) => (
              <li
                key={`${event.gameVersion}-${event.ordinal}`}
                className="flex items-baseline justify-between gap-4 px-4 py-3 text-sm"
              >
                <span>{phaseHistoryLabel(event, events[index + 1])}</span>
                <time
                  dateTime={event.occurredAt}
                  className="shrink-0 font-mono text-xs text-[var(--ink-muted)]"
                >
                  {eventTime.format(new Date(event.occurredAt))}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="px-4 py-3 text-sm text-[var(--ink-muted)]">
            Phase changes appear here once you start tracking.
          </p>
        )}
      </Tabs.Panel>
    </Tabs.Root>
  );
}
