"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";

import { ReminderToken } from "@/components/grimoire/reminder-token";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { GameToken } from "@/lib/game-data/types";
import { cn } from "@/lib/utils";

export function DraggableReminderToken({
  reminder,
  playerName,
  size,
  selected,
  onSelect,
}: {
  reminder: GameToken;
  playerName: string;
  size: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `reminder:${reminder.id}`,
    });
  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    if (isDragging) setTooltipOpen(false);
  }, [isDragging]);

  return (
    <Tooltip open={tooltipOpen && !isDragging} onOpenChange={setTooltipOpen}>
      <TooltipTrigger
        ref={setNodeRef}
        className={cn("reminder-token-trigger", isDragging && "is-dragging")}
        style={{ transform: CSS.Translate.toString(transform) }}
        aria-label={`${reminder.label} reminder on ${playerName}`}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        {...listeners}
        {...attributes}
      >
        <ReminderToken
          label={reminder.label}
          roleId={reminder.roleId}
          size={size}
          selected={selected}
        />
      </TooltipTrigger>
      <TooltipContent>
        <span className="reminder-token-tooltip">
          <strong>{reminder.label}</strong>
          <span>{playerName}</span>
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
