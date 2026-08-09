"use client";

import {
  ArrowLeft,
  ChevronDown,
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

import { CharacterToken } from "@/components/grimoire/character-token";
import { ReminderIcon } from "@/components/grimoire/reminder-icon";
import { RemovePlayerButton } from "@/components/grimoire/remove-player-button";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { roleById } from "@/lib/game-data";
import type {
  Alignment,
  EditionId,
  GameToken,
  Seat,
} from "@/lib/game-data/types";
import {
  getInPlayReminderSources,
  getScriptReminderSources,
} from "@/lib/reminder-catalog";
import { getReminderKey, type ReminderDefinition } from "@/lib/reminders";
import { cn } from "@/lib/utils";

type PlayerMenuView = "player" | "reminders";

export function PlayerContextMenu({
  editionId,
  seat,
  seats,
  gameTokens,
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
  const inPlaySources = getInPlayReminderSources(seats, seat.id, gameTokens);
  const inPlayReminders = inPlaySources.flatMap((source) => source.definitions);
  const scriptReminders = getScriptReminderSources(editionId).flatMap(
    (source) => source.definitions,
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
              focusStyle="surface"
              className={cn(
                "player-menu-role tactile-action tactile-surface",
                role && "has-character",
              )}
              onClick={onChooseRole}
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
                  onClick={() => setEditingName(true)}
                >
                  <strong>{seat.playerName}</strong>
                  <Pencil aria-hidden="true" />
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
            <MenuControl label="Status">
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
              <MenuControl label="Ghost Vote">
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
              <MenuControl label="Player Type">
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
            <Button type="button" variant="quiet" onClick={onChooseRole}>
              <LibraryBig className="size-4" />
              {role ? "Change Character" : "Choose Character"}
            </Button>
            <Button
              type="button"
              variant="quiet"
              onClick={() => setView("reminders")}
            >
              <ReminderIcon className="size-4" />
              Add Reminder
              {targetReminderCount > 0 && (
                <span className="player-menu-count">{targetReminderCount}</span>
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
        <ReminderPicker
          playerName={seat.playerName}
          inPlayReminders={inPlayReminders}
          scriptReminders={scriptReminders}
          placedCounts={placedCounts}
          onBack={() => setView("player")}
          onClose={onClose}
          onAddReminder={onAddReminder}
        />
      )}
    </section>
  );
}

function ReminderPicker({
  playerName,
  inPlayReminders,
  scriptReminders,
  placedCounts,
  onBack,
  onClose,
  onAddReminder,
}: {
  playerName: string;
  inPlayReminders: ReminderDefinition[];
  scriptReminders: ReminderDefinition[];
  placedCounts: Map<string, number>;
  onBack: () => void;
  onClose: () => void;
  onAddReminder: (definition: ReminderDefinition) => void;
}) {
  return (
    <>
      <header className="player-menu-header reminder-menu-header">
        <IconButton
          label="Back"
          size="sm"
          variant="quiet"
          tooltip={false}
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
        </IconButton>
        <div className="player-menu-identity">
          <strong>Add Reminder</strong>
          <span>Add to {playerName}</span>
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

      <div className="player-reminder-menu">
        {inPlayReminders.length > 0 && (
          <PlayerReminderSection
            label="In-Play Reminders"
            definitions={inPlayReminders}
            placedCounts={placedCounts}
            onAddReminder={onAddReminder}
          />
        )}
        {inPlayReminders.length === 0 && (
          <p className="player-reminder-empty">
            Assign characters to make their reminders available here.
          </p>
        )}
        {scriptReminders.length > 0 && (
          <details className="player-reminder-collapsible">
            <summary>
              <span className="utility-label">All Script Reminders</span>
              <small>{scriptReminders.length}</small>
              <ChevronDown aria-hidden="true" />
            </summary>
            <PlayerReminderSection
              definitions={scriptReminders}
              placedCounts={placedCounts}
              onAddReminder={onAddReminder}
            />
          </details>
        )}
      </div>
    </>
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
  label?: string;
  definitions: ReminderDefinition[];
  placedCounts: Map<string, number>;
  onAddReminder: (definition: ReminderDefinition) => void;
}) {
  return (
    <section className="player-reminder-section">
      {label && <span className="utility-label">{label}</span>}
      <div className="player-reminder-grid">
        {definitions.map((definition) => {
          const placed = placedCounts.get(definition.key) ?? 0;
          const sourceRole = definition.roleId
            ? roleById.get(definition.roleId)
            : null;
          if (!sourceRole) return null;

          return (
            <Button
              key={definition.key}
              type="button"
              size="sm"
              variant="quiet"
              focusStyle="surface"
              className="tactile-action"
              aria-label={`Add ${definition.label}`}
              onClick={() => onAddReminder(definition)}
            >
              <span className="player-reminder-token-wrap">
                <CharacterToken
                  role={sourceRole}
                  size="lg"
                  className="tactile-surface"
                />
                {placed > 0 && (
                  <span className="player-reminder-count">{placed}</span>
                )}
              </span>
              <span className="player-reminder-label">
                {definition.label}
                {Number.isFinite(definition.copies) &&
                  definition.copies > 1 && (
                    <small aria-label={`${definition.copies} copies`}>
                      ×{definition.copies}
                    </small>
                  )}
              </span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
