"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { EyeOff, Vote } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CharacterToken } from "@/components/grimoire/character-token";
import { EmptyCharacterState } from "@/components/grimoire/empty-character-state";
import {
  PlayerPresenceDot,
  type PlayerPresenceStatus,
} from "@/components/grimoire/player-presence-dot";
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
  redacted,
  readOnly = false,
  publicView = false,
  isOwnSeat = false,
  presenceStatus,
  onSelect,
  onRename,
}: {
  seat: Seat;
  selected: boolean;
  tokenSize: number;
  labelSide: ReminderLabelSide;
  redacted: boolean;
  readOnly?: boolean;
  publicView?: boolean;
  isOwnSeat?: boolean;
  presenceStatus?: PlayerPresenceStatus;
  onSelect: () => void;
  onRename: (playerName: string) => void;
}) {
  const role = seat.roleId ? roleById.get(seat.roleId) : null;
  const visibleRole =
    role && !redacted && (!publicView || isOwnSeat) ? role : null;
  const interactionsDisabled = redacted || readOnly;
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(seat.playerName);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `player:${seat.id}`,
      disabled: interactionsDisabled,
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
        visibleRole && !redacted && `team-${visibleRole.team}`,
        `player-name-${labelSide}`,
        readOnly && "is-read-only",
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
          !redacted &&
            (!publicView || isOwnSeat) &&
            `alignment-${seat.alignment}`,
          !redacted && seat.isTraveller && "is-traveller",
          publicView && "is-public",
          publicView && isOwnSeat && "is-own-seat",
          publicView && !seat.claimedByPlayer && "is-open-seat",
          readOnly && "is-read-only",
          selected && "is-selected",
          !seat.alive && "is-dead",
          redacted && "is-redacted",
        )}
        style={{
          width: tokenSize,
          height: tokenSize,
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (interactionsDisabled) return;
          onSelect();
        }}
        disabled={interactionsDisabled}
        aria-label={
          publicView
            ? seat.claimedByPlayer
              ? `${seat.playerName}, ${presenceStatus === "online" ? "Online" : "Disconnected"}`
              : `Seat ${seat.seatIndex + 1}, Open`
            : redacted
              ? `${seat.playerName}, Character Hidden`
              : undefined
        }
        {...listeners}
        {...attributes}
      >
        {publicView ? (
          redacted && seat.claimedByPlayer ? (
            <span className="redacted-role-token" aria-hidden="true">
              <EyeOff />
              <span>Hidden</span>
            </span>
          ) : visibleRole ? (
            <CharacterToken role={visibleRole} size="fill" appearance="bare" />
          ) : seat.claimedByPlayer ? (
            <EmptyCharacterState variant="unassigned" />
          ) : (
            <span className="public-open-seat" aria-hidden="true">
              <strong>{seat.seatIndex + 1}</strong>
              <span>Open</span>
            </span>
          )
        ) : redacted ? (
          <span className="redacted-role-token" aria-hidden="true">
            <EyeOff />
            <span>Hidden</span>
          </span>
        ) : role ? (
          <CharacterToken role={role} size="fill" appearance="bare" />
        ) : (
          <EmptyCharacterState variant="assignable" />
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
        {redacted || readOnly ? (
          <span className="player-name-line">
            <span className="player-name-static">
              {publicView && !seat.claimedByPlayer
                ? `Seat ${seat.seatIndex + 1}`
                : seat.playerName}
            </span>
            {presenceStatus && <PlayerPresenceDot status={presenceStatus} />}
          </span>
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
        )}
        {visibleRole && !redacted && <small>{visibleRole.name}</small>}
      </div>
    </div>
  );
}
