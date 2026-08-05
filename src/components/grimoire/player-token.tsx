"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CircleDot, Skull, Vote } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { RoleArtwork } from "@/components/grimoire/role-artwork";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { roleById } from "@/lib/game-data";
import type { GameToken, Seat } from "@/lib/game-data/types";
import { cn } from "@/lib/utils";

export function PlayerToken({
  seat,
  selected,
  tokenSize,
  onSelect,
  onRename,
}: {
  seat: Seat;
  selected: boolean;
  tokenSize: number;
  onSelect: () => void;
  onRename: (playerName: string) => void;
}) {
  const role = seat.roleId ? roleById.get(seat.roleId) : null;
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(seat.playerName);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `player:${seat.id}`,
    });

  useEffect(() => {
    if (!editingName) setDraftName(seat.playerName);
  }, [editingName, seat.playerName]);

  useEffect(() => {
    if (!editingName) return;
    nameInputRef.current?.focus();
    nameInputRef.current?.select();
  }, [editingName]);

  function finishEditing() {
    const nextName = draftName.trim();
    if (nextName && nextName !== seat.playerName) onRename(nextName);
    if (!nextName) setDraftName(seat.playerName);
    setEditingName(false);
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "player-token-cluster",
        role && `team-${role.team}`,
        isDragging && "is-dragging",
      )}
      style={{
        width: tokenSize,
        height: tokenSize,
        transform: CSS.Translate.toString(transform),
      }}
    >
      <button
        type="button"
        className={cn(
          "player-token",
          selected && "is-selected",
          !seat.alive && "is-dead",
        )}
        style={{
          width: tokenSize,
          height: tokenSize,
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        {...listeners}
        {...attributes}
      >
        {role ? (
          <RoleArtwork role={role} showName={false} />
        ) : (
          <span className="empty-role-token">
            <span className="empty-role-plus">+</span>
            <span>Character</span>
          </span>
        )}
        {!seat.alive && (
          <span className="death-shroud" aria-label="Dead">
            <Skull className="size-[32%]" strokeWidth={1.8} />
          </span>
        )}
        {!seat.alive && !seat.ghostVoteAvailable && (
          <span className="vote-used-badge" title="Ghost vote used">
            <Vote className="size-[58%]" />
          </span>
        )}
      </button>
      <div className="player-name-label">
        {editingName ? (
          <input
            ref={nameInputRef}
            value={draftName}
            maxLength={40}
            aria-label={`Rename ${seat.playerName}`}
            onChange={(event) => setDraftName(event.target.value)}
            onBlur={finishEditing}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                setDraftName(seat.playerName);
                setEditingName(false);
              }
            }}
            onPointerDown={(event) => event.stopPropagation()}
          />
        ) : (
          <button
            type="button"
            aria-label={`Rename ${seat.playerName}`}
            onClick={(event) => {
              event.stopPropagation();
              onSelect();
              setEditingName(true);
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {seat.playerName}
          </button>
        )}
        {role && <small>{role.name}</small>}
      </div>
    </div>
  );
}

export function CanvasReminderToken({
  reminder,
  playerName,
  size,
  onSelect,
}: {
  reminder: GameToken;
  playerName: string;
  size: number;
  onSelect: () => void;
}) {
  const reminderRole = reminder.roleId ? roleById.get(reminder.roleId) : null;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `reminder:${reminder.id}`,
    });

  return (
    <Tooltip>
      <TooltipTrigger
        ref={setNodeRef}
        className={cn("reminder-orbit-token", isDragging && "is-dragging")}
        style={{
          width: size,
          height: size,
          transform: CSS.Translate.toString(transform),
        }}
        aria-label={`${reminder.label} reminder on ${playerName}`}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        {...listeners}
        {...attributes}
      >
        {reminderRole ? (
          <RoleArtwork role={reminderRole} size="tiny" />
        ) : (
          <CircleDot className="reminder-generic-icon" aria-hidden="true" />
        )}
      </TooltipTrigger>
      <TooltipContent>{reminder.label}</TooltipContent>
    </Tooltip>
  );
}
