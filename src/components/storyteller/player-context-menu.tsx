"use client";

import { Eye, LibraryBig, Plus, X } from "lucide-react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { CharacterToken } from "@/components/grimoire/character-token";
import { PlayerReminderGrid } from "@/components/storyteller/player-reminder-grid";
import { PlayerReminderPicker } from "@/components/storyteller/player-reminder-picker";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Tooltip } from "@/components/ui/tooltip";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { roleById, teamLabel } from "@/lib/game-data";
import type {
  Alignment,
  EditionId,
  GameToken,
  Seat,
} from "@/lib/game-data/types";
import {
  getPrioritizedInPlayReminderDefinitions,
  getScriptReminderSources,
} from "@/lib/reminder-catalog";
import type { ReminderDefinition } from "@/lib/reminders";

type PlayerMenuView = "player" | "all-reminders";

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
  onShowCharacter,
  onSetAlive,
  onSetAlignment,
  onSetGhostVote,
  onAddReminder,
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
  onShowCharacter: () => void;
  onSetAlive: (alive: boolean) => void;
  onSetAlignment: (alignment: Alignment) => void;
  onSetGhostVote: (available: boolean) => void;
  onAddReminder: (definition: ReminderDefinition) => void;
}) {
  const [view, setView] = useState<PlayerMenuView>("player");
  const role = seat.roleId ? roleById.get(seat.roleId) : null;
  const inPlayReminders = getPrioritizedInPlayReminderDefinitions(
    seats,
    seat.id,
    gameTokens,
  );
  const scriptReminderCount = getScriptReminderSources(editionId).reduce(
    (count, source) => count + source.definitions.length,
    0,
  );

  useEffect(() => setView("player"), [seat.id]);

  useKeyboardShortcuts(
    [
      {
        id: "show-player-character",
        key: "s",
        enabled: Boolean(role),
        onTrigger: onShowCharacter,
      },
      {
        id: "choose-player-character",
        key: "c",
        onTrigger: onChooseRole,
      },
      {
        id: "show-all-player-reminders",
        key: "m",
        onTrigger: () => setView("all-reminders"),
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
        key: "v",
        enabled: !seat.alive,
        onTrigger: () => onSetGhostVote(!seat.ghostVoteAvailable),
      },
    ],
    shortcutsEnabled && view === "player",
  );

  useKeyboardShortcuts(
    [
      {
        id: "back-from-all-reminders",
        key: "b",
        onTrigger: () => setView("player"),
      },
    ],
    shortcutsEnabled && view === "all-reminders",
  );

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
            {role ? (
              <div className="player-menu-role has-character" aria-hidden>
                <CharacterToken role={role} size="md" />
              </div>
            ) : (
              <div className="player-menu-role" aria-hidden>
                <Plus className="size-5" />
              </div>
            )}
            <div className="player-menu-identity">
              <strong>{seat.playerName}</strong>
              <span>
                {role?.name ?? "Character not assigned"} · Seat{" "}
                {seat.seatIndex + 1}
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

          <div className="player-menu-scroll">
            {role ? (
              <section
                className="player-role-dossier"
                aria-labelledby="selected-player-role"
              >
                <div className="player-role-dossier-title">
                  <strong id="selected-player-role">{role.name}</strong>
                  <span className={`team-${role.team}`}>
                    {teamLabel(role.team)}
                  </span>
                </div>
                <p>{role.ability}</p>
                <div className="player-role-actions">
                  <Tooltip
                    content="Show Character"
                    shortcuts={["S"]}
                    shortcutSize="sm"
                  >
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={onShowCharacter}
                      aria-keyshortcuts="S"
                      aria-label="Show Character"
                    >
                      <Eye className="size-4" />
                      Show Character
                    </Button>
                  </Tooltip>
                  <Tooltip
                    content="Change Character"
                    shortcuts={["C"]}
                    shortcutSize="sm"
                  >
                    <Button
                      type="button"
                      size="sm"
                      variant="quiet"
                      onClick={onChooseRole}
                      aria-keyshortcuts="C"
                      aria-label={`Change ${seat.playerName}'s Character`}
                    >
                      <LibraryBig className="size-4" />
                      Change
                    </Button>
                  </Tooltip>
                </div>
              </section>
            ) : (
              <section className="player-role-dossier is-empty">
                <p>Assign a character to show their ability here.</p>
                <Tooltip
                  content="Choose Character"
                  shortcuts={["C"]}
                  shortcutSize="sm"
                >
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={onChooseRole}
                    aria-keyshortcuts="C"
                    aria-label={`Assign a Character to ${seat.playerName}`}
                  >
                    <Plus className="size-4" />
                    Choose Character
                  </Button>
                </Tooltip>
              </section>
            )}

            <section
              className="player-menu-reminders"
              aria-labelledby="player-menu-reminders-title"
            >
              <div className="player-menu-section-heading">
                <span
                  id="player-menu-reminders-title"
                  className="utility-label"
                >
                  In-Play Reminders
                </span>
                <small>{inPlayReminders.length}</small>
              </div>
              {inPlayReminders.length > 0 ? (
                <PlayerReminderGrid
                  definitions={inPlayReminders}
                  gameTokens={gameTokens}
                  targetSeatId={seat.id}
                  playerName={seat.playerName}
                  onAddReminder={onAddReminder}
                />
              ) : (
                <p className="player-reminder-empty">
                  Assign characters to put their reminders here.
                </p>
              )}
              <Tooltip
                content="All Script Reminders"
                shortcuts={["M"]}
                shortcutSize="sm"
              >
                <Button
                  type="button"
                  size="sm"
                  variant="quiet"
                  className="player-menu-all-reminders"
                  aria-keyshortcuts="M"
                  aria-label="All Script Reminders"
                  onClick={() => setView("all-reminders")}
                >
                  All Script Reminders
                  <span>{scriptReminderCount}</span>
                </Button>
              </Tooltip>
            </section>

            <section className="player-menu-state" aria-label="Player state">
              <div className="player-menu-state-grid">
                <MenuControl label="Status" shortcut="D" tooltipSide="left">
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
                <MenuControl label="Alignment" shortcut="A" tooltipSide="right">
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
              </div>
              {!seat.alive && (
                <MenuControl label="Ghost Vote" shortcut="V" tooltipSide={side}>
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
            </section>
          </div>
        </>
      ) : (
        <PlayerReminderPicker
          editionId={editionId}
          targetSeatId={seat.id}
          playerName={seat.playerName}
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
  tooltipSide = "top",
  children,
}: {
  label: string;
  shortcut?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  children: ReactNode;
}) {
  const control = (
    <div className="player-menu-control" aria-keyshortcuts={shortcut}>
      <span className="player-menu-control-label">
        <span className="utility-label">{label}</span>
      </span>
      {children}
    </div>
  );

  if (!shortcut) return control;

  return (
    <Tooltip
      content={`Toggle ${label}`}
      shortcuts={[shortcut]}
      shortcutSize="sm"
      side={tooltipSide}
    >
      {control}
    </Tooltip>
  );
}
