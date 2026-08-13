"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef, useState } from "react";

import {
  PlayerTokenView,
  StaticPlayerTokenName,
} from "@/components/grimoire/player-token";
import { createStorytellerPlayerTokenModel } from "@/components/grimoire/player-token-model";
import {
  PlayerPresenceDot,
  type PlayerPresenceStatus,
} from "@/components/grimoire/player-presence-dot";
import { Input } from "@/components/ui/input";
import type { Seat } from "@/lib/game-data/types";
import type { ReminderLabelSide } from "@/lib/reminder-layout";

export function StorytellerPlayerToken({
  seat,
  selected,
  tokenSize,
  labelSide,
  redacted,
  presenceStatus,
  onSelect,
  onRename,
}: {
  seat: Seat;
  selected: boolean;
  tokenSize: number;
  labelSide: ReminderLabelSide;
  redacted: boolean;
  presenceStatus?: PlayerPresenceStatus;
  onSelect: () => void;
  onRename: (playerName: string) => void;
}) {
  const model = createStorytellerPlayerTokenModel(seat);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(seat.playerName);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `player:${seat.id}`,
      disabled: redacted,
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
    <PlayerTokenView
      model={model}
      selected={selected}
      tokenSize={tokenSize}
      labelSide={labelSide}
      redacted={redacted}
      variant="storyteller"
      presenceStatus={presenceStatus}
      isDragging={isDragging}
      transform={CSS.Translate.toString(transform)}
      containerRef={setNodeRef}
      buttonProps={{ ...listeners, ...attributes }}
      onSelect={onSelect}
      nameControl={
        redacted ? (
          <StaticPlayerTokenName
            name={seat.playerName}
            presenceStatus={presenceStatus}
          />
        ) : editingName ? (
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
          <span className="player-name-line">
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
            {presenceStatus && <PlayerPresenceDot status={presenceStatus} />}
          </span>
        )
      }
    />
  );
}
