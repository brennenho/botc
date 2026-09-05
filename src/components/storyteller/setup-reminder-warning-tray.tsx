"use client";

import { AlertTriangle } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState } from "react";

import { ReminderTokenAction } from "@/components/storyteller/reminder-token-action";
import { Tooltip } from "@/components/ui/tooltip";
import { roleById } from "@/lib/game-data";
import type { SetupReminderWarning } from "@/lib/game-data/types";
import {
  getReminderDefinition,
  type ReminderDefinition,
} from "@/lib/reminders";
import { cn } from "@/lib/utils";

export function SetupReminderWarningTray({
  warnings,
  pendingReminderKey,
  onSelectReminder,
}: {
  warnings: SetupReminderWarning[];
  pendingReminderKey: string | null;
  onSelectReminder: (definition: ReminderDefinition) => void;
}) {
  const [compactOpen, setCompactOpen] = useState(false);
  const tokenGridId = useId();
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const restoreFocusKeyRef = useRef<string | null>(null);
  const previousPendingKeyRef = useRef<string | null>(null);
  const items = warnings.flatMap((warning) => {
    const role = roleById.get(warning.roleId);
    if (!role) return [];

    return warning.missing.map(({ label, count }) => ({
      count,
      definition: getReminderDefinition(role, label),
    }));
  });
  const totalMissing = items.reduce((total, item) => total + item.count, 0);
  const compactVisible = compactOpen && pendingReminderKey === null;

  useLayoutEffect(() => {
    const previousPendingKey = previousPendingKeyRef.current;
    previousPendingKeyRef.current = pendingReminderKey;

    if (previousPendingKey === null || pendingReminderKey !== null) return;

    const restoreFocusKey = restoreFocusKeyRef.current;
    restoreFocusKeyRef.current = null;
    if (!restoreFocusKey) return;

    triggerRefs.current.get(restoreFocusKey)?.focus({ preventScroll: true });
  }, [pendingReminderKey]);

  return (
    <aside
      className={cn("board-setup-warning", pendingReminderKey && "is-placing")}
      aria-label="Missing setup reminders"
      data-compact-open={compactOpen ? "" : undefined}
    >
      <button
        type="button"
        className="board-setup-warning-summary tactile-action"
        aria-label={`${compactVisible ? "Hide" : "Show"} ${totalMissing} missing setup ${totalMissing === 1 ? "reminder" : "reminders"}`}
        aria-expanded={compactVisible}
        aria-controls={tokenGridId}
        onClick={() => setCompactOpen((open) => !open)}
      >
        <AlertTriangle aria-hidden="true" />
        <span>Missing reminders</span>
        <strong aria-hidden="true">{totalMissing}</strong>
      </button>

      <header className="board-setup-warning-header">
        <AlertTriangle aria-hidden="true" />
        <span className="utility-label">Missing Reminders</span>
        <span className="board-setup-warning-total" aria-hidden="true">
          {totalMissing}
        </span>
      </header>

      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {totalMissing} setup {totalMissing === 1 ? "reminder" : "reminders"}{" "}
        missing.
      </p>

      <div id={tokenGridId} className="board-setup-warning-tokens">
        {items.map(({ count, definition }) => {
          const active = pendingReminderKey === definition.key;
          const missingLabel = `${count} ${count === 1 ? "copy" : "copies"} missing`;

          return (
            <Tooltip
              key={definition.key}
              content={`${definition.sourceName}: ${definition.label}`}
            >
              <ReminderTokenAction
                ref={(node) => {
                  if (node) triggerRefs.current.set(definition.key, node);
                  else triggerRefs.current.delete(definition.key);
                }}
                className="board-setup-warning-token"
                actionLabel={`Place ${definition.label} reminder from ${definition.sourceName}; ${missingLabel}`}
                reminderLabel={definition.label}
                roleId={definition.roleId}
                tokenSize="tray"
                count={count}
                selected={active}
                caption={definition.label}
                onClick={() => {
                  restoreFocusKeyRef.current = definition.key;
                  onSelectReminder(definition);
                }}
              />
            </Tooltip>
          );
        })}
      </div>
    </aside>
  );
}
