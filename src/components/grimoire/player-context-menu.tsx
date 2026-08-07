"use client";

import {
  ArrowLeft,
  CircleDot,
  LibraryBig,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { RoleArtwork } from "@/components/grimoire/role-artwork";
import { ReminderToken } from "@/components/grimoire/reminder-token";
import { RemovePlayerButton } from "@/components/grimoire/remove-player-button";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { roleById } from "@/lib/game-data";
import type { Alignment, GameToken, Seat } from "@/lib/game-data/types";
import {
  generalReminderDefinitions,
  getReminderKey,
  getRoleReminderDefinitions,
  type ReminderDefinition,
} from "@/lib/reminders";

type PlayerMenuView = "player" | "reminders";

export function PlayerContextMenu({
  seat,
  reminders,
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
  seat: Seat;
  reminders: GameToken[];
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
  const roleReminders = getRoleReminderDefinitions(role ?? null);
  const roleReminderLabels = new Set(
    roleReminders.map((definition) => definition.label.toLowerCase()),
  );
  const generalReminders = generalReminderDefinitions.filter(
    (definition) => !roleReminderLabels.has(definition.label.toLowerCase()),
  );
  const placedCounts = reminders.reduce((counts, reminder) => {
    const key = getReminderKey(reminder);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

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

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

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
              className="player-menu-role"
              onClick={onChooseRole}
              aria-label={
                role
                  ? `Change ${seat.playerName}'s character`
                  : `Assign a character to ${seat.playerName}`
              }
            >
              {role ? (
                <RoleArtwork role={role} size="compact" showName={false} />
              ) : (
                <Plus className="size-5" />
              )}
            </Button>
            <div className="player-menu-identity">
              {editingName ? (
                <input
                  ref={nameInputRef}
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
                  onClick={() => setEditingName(true)}
                >
                  <strong>{seat.playerName}</strong>
                  <Pencil aria-hidden="true" />
                </Button>
              )}
              <span>
                {role?.name ?? "Choose character"} · Seat {seat.seatIndex + 1}
              </span>
            </div>
            <IconButton
              label="Close player controls"
              size="sm"
              variant="quiet"
              tooltip={false}
              onClick={onClose}
            >
              <X className="size-4" />
            </IconButton>
          </header>

          <div className="player-menu-state">
            <MenuControl label="Status">
              <SegmentedControl
                value={seat.alive ? "alive" : "dead"}
                label="Life status"
                className="player-menu-segmented"
                options={[
                  { value: "alive", label: "Alive" },
                  { value: "dead", label: "Dead" },
                ]}
                onChange={(value) => onSetAlive(value === "alive")}
              />
            </MenuControl>
            {!seat.alive && (
              <MenuControl label="Ghost vote">
                <SegmentedControl
                  value={seat.ghostVoteAvailable ? "available" : "used"}
                  label="Ghost vote"
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
              <MenuControl label="Alignment">
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
              <MenuControl label="Player type">
                <SegmentedControl
                  value={seat.isTraveller ? "traveller" : "resident"}
                  label="Player type"
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
            <Button type="button" variant="quiet" onClick={onChooseRole}>
              <LibraryBig className="size-4" />
              {role ? "Change character" : "Choose character"}
            </Button>
            <Button
              type="button"
              variant="quiet"
              onClick={() => setView("reminders")}
            >
              <CircleDot className="size-4" />
              Add reminder
              {reminders.length > 0 && (
                <span className="player-menu-count">{reminders.length}</span>
              )}
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
        <>
          <header className="player-menu-header reminder-menu-header">
            <IconButton
              label="Back to player controls"
              size="sm"
              variant="quiet"
              tooltip={false}
              onClick={() => setView("player")}
            >
              <ArrowLeft className="size-4" />
            </IconButton>
            <div className="player-menu-identity">
              <strong>Reminders</strong>
              <span>{seat.playerName}</span>
            </div>
            <IconButton
              label="Close player controls"
              size="sm"
              variant="quiet"
              tooltip={false}
              onClick={onClose}
            >
              <X className="size-4" />
            </IconButton>
          </header>
          <div className="player-reminder-menu">
            {roleReminders.length > 0 && (
              <PlayerReminderSection
                label={role?.name ?? "Character"}
                definitions={roleReminders}
                placedCounts={placedCounts}
                onAddReminder={onAddReminder}
              />
            )}
            <PlayerReminderSection
              label="General"
              definitions={generalReminders}
              placedCounts={placedCounts}
              onAddReminder={onAddReminder}
            />
          </div>
        </>
      )}
    </section>
  );
}

function MenuControl({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="player-menu-control">
      <span className="utility-label">{label}</span>
      {children}
    </div>
  );
}

function PlayerReminderSection({
  label,
  definitions,
  placedCounts,
  onAddReminder,
}: {
  label: string;
  definitions: ReminderDefinition[];
  placedCounts: Map<string, number>;
  onAddReminder: (definition: ReminderDefinition) => void;
}) {
  return (
    <section className="player-reminder-section">
      <span className="utility-label">{label}</span>
      <div className="player-reminder-grid">
        {definitions.map((definition) => {
          const placed = placedCounts.get(definition.key) ?? 0;
          return (
            <Button
              key={definition.key}
              type="button"
              size="sm"
              variant="quiet"
              aria-label={`Add ${definition.label}`}
              onClick={() => onAddReminder(definition)}
            >
              <span className="player-reminder-token-wrap">
                <ReminderToken
                  label={definition.label}
                  roleId={definition.roleId}
                  size="tray"
                  count={
                    Number.isFinite(definition.copies)
                      ? definition.copies
                      : undefined
                  }
                />
                {placed > 0 && (
                  <span className="player-reminder-count">{placed}</span>
                )}
              </span>
              <span>{definition.label}</span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
