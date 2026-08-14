"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { ReminderToken } from "@/components/storyteller/reminder-token";
import { IconButton } from "@/components/ui/icon-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { roleById } from "@/lib/game-data";
import type { GameToken } from "@/lib/game-data/types";
import { cn } from "@/lib/utils";

export function DraggableReminderToken({
  reminder,
  playerName,
  size,
  selected,
  positionLocked = false,
  onSelect,
  onRemove,
}: {
  reminder: GameToken;
  playerName: string;
  size: number;
  selected: boolean;
  positionLocked?: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const sourceName = reminder.roleId
    ? (roleById.get(reminder.roleId)?.name ?? "Character")
    : "General";
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `reminder:${reminder.id}`,
      disabled: positionLocked,
    });
  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    if (isDragging) setTooltipOpen(false);
  }, [isDragging]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "reminder-token-control",
        selected && "is-selected",
        isDragging && "is-dragging",
      )}
      style={{ transform: CSS.Translate.toString(transform) }}
    >
      <Tooltip open={tooltipOpen && !isDragging} onOpenChange={setTooltipOpen}>
        <TooltipTrigger
          className="reminder-token-trigger tactile-action"
          aria-label={`${reminder.label} reminder on ${playerName}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          {...(positionLocked ? {} : listeners)}
          {...(positionLocked ? {} : attributes)}
        >
          <ReminderToken
            label={reminder.label}
            roleId={reminder.roleId}
            size={size}
            selected={selected}
            presentation="labeled"
          />
        </TooltipTrigger>
        <TooltipContent>
          <span className="reminder-token-tooltip">
            <strong>{reminder.label}</strong>
            <span>
              {sourceName} · {playerName}
            </span>
          </span>
        </TooltipContent>
      </Tooltip>
      <IconButton
        label={`Remove ${reminder.label} Reminder`}
        size="sm"
        variant="quiet"
        tooltipSide="top"
        className="token-clear-button reminder-token-clear size-4"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
      >
        <X className="size-2.5" />
      </IconButton>
    </div>
  );
}
