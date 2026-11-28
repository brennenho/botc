import { Flag, Moon, Sun, Undo2 } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { NightOrderPanel } from "@/components/storyteller/night-order-sheet";
import {
  NightPhaseControls,
  type PhaseControlsProps,
} from "@/components/storyteller/night-phase-controls";
import { ReminderToken } from "@/components/storyteller/reminder-token";
import { Tabs } from "@/components/ui/tabs";
import type { GameEvent } from "@/lib/game-data/types";
import { isPhaseReturn, phaseLabel } from "@/lib/game-phase";

const eventTime = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });
const historyIcons = { day: Sun, night: Moon, setup: Flag, return: Undo2 };

type ReminderEvent = Exclude<GameEvent, { kind: "phase_started" }>;

function groupHistory(events: GameEvent[]) {
  const groups: {
    anchor: GameEvent;
    returned: boolean;
    reminders: ReminderEvent[];
  }[] = [];
  let reminders: ReminderEvent[] = [];

  // History is newest first. Each phase start closes its own group, even on a return.
  for (const [index, event] of events.entries()) {
    if (event.kind !== "phase_started") reminders.push(event);
    if (event.kind === "phase_started" || index === events.length - 1) {
      groups.push({
        anchor: event,
        returned: isPhaseReturn(event, events[index + 1]),
        reminders,
      });
      reminders = [];
    }
  }
  return groups;
}

function EventTime({ at }: { at: string }) {
  return <time dateTime={at}>{eventTime.format(new Date(at))}</time>;
}

function ReminderEntry({ event }: { event: ReminderEvent }) {
  const { label, playerName, roleId } = event.reminder;
  const action =
    event.kind === "reminder_placed" ? "placed on" : "removed from";
  return (
    <li>
      <ReminderToken label={label} roleId={roleId} size={24} />
      <span>
        <strong>{label}</strong> {action} {playerName ?? "the board"}
      </span>
      <EventTime at={event.occurredAt} />
    </li>
  );
}

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
      {groupHistory(events).map(({ anchor, returned, reminders }) => {
        const phase = phaseLabel(anchor);
        const marker = returned ? "return" : anchor.phase;
        const Icon = historyIcons[marker];
        const started = anchor.kind === "phase_started";
        return (
          <li key={`${anchor.gameVersion}-${anchor.ordinal}`}>
            {reminders.length > 0 && (
              <ol
                className="game-timeline-reminders"
                role="list"
                aria-label={`${phase} reminders`}
              >
                {reminders.map((event) => (
                  <ReminderEntry
                    key={`${event.gameVersion}-${event.ordinal}`}
                    event={event}
                  />
                ))}
              </ol>
            )}
            <div className="game-timeline-phase">
              <Icon
                className="game-timeline-marker"
                data-marker={marker}
                aria-hidden="true"
              />
              <h3>
                {returned
                  ? `Returned to ${phase}`
                  : started
                    ? `${phase} began`
                    : phase}
              </h3>
              {started && <EventTime at={anchor.occurredAt} />}
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
