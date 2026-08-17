"use client";

import { LibraryBig, Pencil, Plus, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { CharacterToken } from "@/components/grimoire/character-token";
import { PlayerReminderPicker } from "@/components/storyteller/player-reminder-picker";
import { ReminderIcon } from "@/components/storyteller/reminder-icon";
import { RemovePlayerButton } from "@/components/storyteller/remove-player-button";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ShortcutKey } from "@/components/ui/shortcut-key";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { roleById } from "@/lib/game-data";
import type {
  Alignment,
  EditionId,
  GameToken,
  Seat,
} from "@/lib/game-data/types";
import type { ReminderDefinition } from "@/lib/reminders";
import { cn } from "@/lib/utils";

type PlayerMenuView = "player" | "reminders";

export function PlayerContextMenu({
  editionId,
  seat,
  seats,
  gameTokens,
  shortcutsEnabled,
  side,
  style,
  onClose,
  onChooseRole,
  onRename,
  onSetAlive,
  onSetAlignment,
  onSetGhostVote,
  onSetTraveller,
  onAddReminder,
  onRemovePlayer,
}: {
  editionId: EditionId;
  seat: Seat;
  seats: Seat[];
  gameTokens: GameToken[];
  shortcutsEnabled: boolean;
  side: "left" | "right";
  style: CSSProperties;
  onClose: () => void;
  onChooseRole: () => void;
  onRename: (playerName: string) => void;
  onSetAlive: (alive: boolean) => void;
  onSetAlignment: (alignment: Alignment) => void;
  onSetGhostVote: (available: boolean) => void;
  onSetTraveller: (isTraveller: boolean) => void;
  onAddReminder: (definition: ReminderDefinition) => void;
  onRemovePlayer: () => void;
}) {
  const [view, setView] = useState<PlayerMenuView>("player");
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(seat.playerName);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const role = seat.roleId ? roleById.get(seat.roleId) : null;
  const reminders = gameTokens.filter(
    (token) => token.tokenType === "reminder",
  );
  const targetReminderCount = reminders.filter(
    (reminder) => reminder.seatId === seat.id,
  ).length;

  useEffect(() => {
    setView("player");
    setEditingName(false);
    setDraftName(seat.playerName);
  }, [seat.id, seat.playerName]);

  useEffect(() => {
    if (!editingName) return;
    nameInputRef.current?.focus();
    nameInputRef.current?.select();
  }, [editingName]);

  useKeyboardShortcuts(
    [
      {
        id: "choose-player-character",
        key: "c",
        onTrigger: onChooseRole,
      },
      {
        id: "rename-player",
        key: "e",
        onTrigger: () => setEditingName(true),
      },
      {
        id: "add-player-reminder",
        key: "m",
        onTrigger: () => setView("reminders"),
      },
      {
        id: "toggle-player-life",
        key: "d",
        onTrigger: () => onSetAlive(!seat.alive),
      },
      {
        id: "toggle-player-alignment",
        key: "a",
        onTrigger: () =>
          onSetAlignment(seat.alignment === "good" ? "evil" : "good"),
      },
      {
        id: "toggle-player-ghost-vote",
        key: "g",
        enabled: !seat.alive,
        onTrigger: () => onSetGhostVote(!seat.ghostVoteAvailable),
      },
      {
        id: "toggle-player-type",
        key: "t",
        onTrigger: () => onSetTraveller(!seat.isTraveller),
      },
    ],
    shortcutsEnabled && view === "player",
  );

  function finishEditingName() {
    const nextName = draftName.trim();
    if (nextName && nextName !== seat.playerName) onRename(nextName);
    if (!nextName) setDraftName(seat.playerName);
    setEditingName(false);
  }

  return (
    <section
      className="player-context-menu"
      data-side={side}
      style={style}
      role="dialog"
      aria-label={`${seat.playerName} controls`}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {view === "player" ? (
        <>
          <header className="player-menu-header">
            <Button
              type="button"
              size="icon"
              variant="quiet"
              focusStyle="surface"
              className={cn(
                "player-menu-role tactile-action tactile-surface",
                role && "has-character",
              )}
              onClick={onChooseRole}
              aria-keyshortcuts="C"
              aria-label={
                role
                  ? `Change ${seat.playerName}'s Character`
                  : `Assign a Character to ${seat.playerName}`
              }
            >
              {role ? (
                <CharacterToken role={role} size="md" />
              ) : (
                <Plus className="size-5" />
              )}
            </Button>
            <div className="player-menu-identity">
              {editingName ? (
                <Input
                  ref={nameInputRef}
                  variant="inline"
                  className="player-name-input"
                  value={draftName}
                  maxLength={40}
                  aria-label={`Rename ${seat.playerName}`}
                  onChange={(event) => setDraftName(event.target.value)}
                  onBlur={finishEditingName}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                    if (event.key === "Escape") {
                      event.stopPropagation();
                      setDraftName(seat.playerName);
                      setEditingName(false);
                    }
                  }}
                />
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="quiet"
                  aria-keyshortcuts="E"
                  onClick={() => setEditingName(true)}
                >
                  <strong>{seat.playerName}</strong>
                  <Pencil aria-hidden="true" />
                  <ShortcutKey shortcut="E" />
                </Button>
              )}
              <span>
                {role?.name ?? "Choose Character"} · Seat {seat.seatIndex + 1}
              </span>
            </div>
            <IconButton
              label="Close Player Controls"
              size="sm"
              variant="quiet"
              tooltip={false}
              onClick={onClose}
            >
              <X className="size-4" />
            </IconButton>
          </header>

          <div className="player-menu-state">
            <MenuControl label="Status" shortcut="D">
              <SegmentedControl
                value={seat.alive ? "alive" : "dead"}
                label="Life Status"
                className="player-menu-segmented"
                options={[
                  { value: "alive", label: "Alive" },
                  { value: "dead", label: "Dead" },
                ]}
                onChange={(value) => onSetAlive(value === "alive")}
              />
            </MenuControl>
            {!seat.alive && (
              <MenuControl label="Ghost Vote" shortcut="G">
                <SegmentedControl
                  value={seat.ghostVoteAvailable ? "available" : "used"}
                  label="Ghost Vote"
                  className="player-menu-segmented"
                  options={[
                    { value: "available", label: "Available" },
                    { value: "used", label: "Used" },
                  ]}
                  onChange={(value) => onSetGhostVote(value === "available")}
                />
              </MenuControl>
            )}
            <div className="player-menu-state-grid">
              <MenuControl label="Alignment" shortcut="A">
                <SegmentedControl
                  value={seat.alignment}
                  label="Alignment"
                  className="player-menu-segmented"
                  options={[
                    { value: "good", label: "Good" },
                    { value: "evil", label: "Evil" },
                  ]}
                  onChange={onSetAlignment}
                />
              </MenuControl>
              <MenuControl label="Player Type" shortcut="T">
                <SegmentedControl
                  value={seat.isTraveller ? "traveller" : "resident"}
                  label="Player Type"
                  className="player-menu-segmented"
                  options={[
                    { value: "resident", label: "Resident" },
                    { value: "traveller", label: "Traveller" },
                  ]}
                  onChange={(value) => onSetTraveller(value === "traveller")}
                />
              </MenuControl>
            </div>
          </div>

          <div className="player-menu-actions">
            <Button
              type="button"
              variant="quiet"
              aria-keyshortcuts="C"
              onClick={onChooseRole}
            >
              <LibraryBig className="size-4" />
              {role ? "Change Character" : "Choose Character"}
              <ShortcutKey shortcut="C" />
            </Button>
            <Button
              type="button"
              variant="quiet"
              aria-keyshortcuts="M"
              onClick={() => setView("reminders")}
            >
              <ReminderIcon className="size-4" />
              Add Reminder
              {targetReminderCount > 0 && (
                <span className="player-menu-count">{targetReminderCount}</span>
              )}
              <ShortcutKey shortcut="M" />
            </Button>
          </div>

          <footer className="player-menu-footer">
            <RemovePlayerButton
              playerName={seat.playerName}
              onRemove={onRemovePlayer}
            />
          </footer>
        </>
      ) : (
        <PlayerReminderPicker
          editionId={editionId}
          seat={seat}
          seats={seats}
          gameTokens={gameTokens}
          onBack={() => setView("player")}
          onClose={onClose}
          onAddReminder={onAddReminder}
        />
      )}
    </section>
  );
}

function MenuControl({
  label,
  shortcut,
  children,
}: {
  label: string;
  shortcut?: string;
  children: ReactNode;
}) {
  return (
    <div className="player-menu-control" aria-keyshortcuts={shortcut}>
      <span className="player-menu-control-label">
        <span className="utility-label">{label}</span>
        {shortcut ? <ShortcutKey shortcut={shortcut} /> : null}
      </span>
      {children}
    </div>
  );
}
