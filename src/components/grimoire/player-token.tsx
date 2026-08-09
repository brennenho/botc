"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Vote } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CharacterToken } from "@/components/grimoire/character-token";
import { Input } from "@/components/ui/input";
import { roleById } from "@/lib/game-data";
import type { Seat } from "@/lib/game-data/types";
import type { ReminderLabelSide } from "@/lib/reminder-layout";
import { cn } from "@/lib/utils";

export function PlayerToken({
  seat,
  selected,
  tokenSize,
  labelSide,
  onSelect,
  onRename,
}: {
  seat: Seat;
  selected: boolean;
  tokenSize: number;
  labelSide: ReminderLabelSide;
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
        `player-name-${labelSide}`,
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
          "player-token tactile-action tactile-surface",
          `alignment-${seat.alignment}`,
          seat.isTraveller && "is-traveller",
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
          <CharacterToken role={role} size="fill" appearance="bare" />
        ) : (
          <span className="empty-role-token">
            <span className="empty-role-plus">+</span>
            <span>Character</span>
          </span>
        )}
        {!seat.alive && <span className="death-overlay" aria-label="Dead" />}
        {!seat.alive && (
          <span
            className={cn(
              "ghost-vote-badge",
              !seat.ghostVoteAvailable && "is-used",
            )}
            role="status"
            aria-label={
              seat.ghostVoteAvailable
                ? "Ghost Vote Available"
                : "Ghost Vote Used"
            }
            title={
              seat.ghostVoteAvailable
                ? "Ghost Vote Available"
                : "Ghost Vote Used"
            }
          >
            <Vote aria-hidden="true" />
            <span className="ghost-vote-slash" aria-hidden="true" />
          </span>
        )}
      </button>
      <div className="player-name-label">
        {editingName ? (
          <Input
            ref={nameInputRef}
            variant="inline"
            className="player-name-input"
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
