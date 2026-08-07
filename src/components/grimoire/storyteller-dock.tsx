"use client";

import { useEffect, useState } from "react";
import {
  CircleDot,
  Moon,
  Plus,
  Skull,
  UserRoundCog,
  Users,
  Vote,
  X,
} from "lucide-react";

import { RoleArtwork } from "@/components/grimoire/role-artwork";
import { ReminderToken } from "@/components/grimoire/reminder-token";
import {
  ConfirmRemoveButton,
  RemovePlayerButton,
} from "@/components/grimoire/remove-player-button";
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
import { cn } from "@/lib/utils";

export function StorytellerDock({
  seat,
  reminders,
  selectedReminder,
  reminderOwner,
  pendingReminder,
  playersOpen,
  nightOpen,
  onCloseSeat,
  onOpenPlayers,
  onOpenNight,
  onChooseRole,
  onSetAlive,
  onSetAlignment,
  onSetGhostVote,
  onAddReminder,
  onRemoveReminder,
  onRemovePlayer,
  onRemoveSelectedReminder,
  onCloseSelectedReminder,
  onCancelReminderPlacement,
}: {
  seat: Seat | null;
  reminders: GameToken[];
  selectedReminder: GameToken | null;
  reminderOwner: Seat | null;
  pendingReminder: ReminderDefinition | null;
  playersOpen: boolean;
  nightOpen: boolean;
  onCloseSeat: () => void;
  onOpenPlayers: () => void;
  onOpenNight: () => void;
  onChooseRole: () => void;
  onSetAlive: (alive: boolean) => void;
  onSetAlignment: (alignment: Alignment) => void;
  onSetGhostVote: (available: boolean) => void;
  onAddReminder: (definition: ReminderDefinition) => void;
  onRemoveReminder: (tokenId: string) => void;
  onRemovePlayer: () => void;
  onRemoveSelectedReminder: () => void;
  onCloseSelectedReminder: () => void;
  onCancelReminderPlacement: () => void;
}) {
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const role = seat?.roleId ? roleById.get(seat.roleId) : null;

  useEffect(() => {
    setRemindersOpen(false);
    setDetailsOpen(false);
  }, [seat?.id]);

  const panelTabs = (
    <nav
      className={cn(
        "storyteller-dock global-dock",
        (playersOpen || nightOpen) && "is-sheet-open",
      )}
      aria-label="Grimoire panels"
    >
      <PanelTabButton
        tab="players"
        icon={<Users />}
        label="Players"
        active={playersOpen}
        onClick={onOpenPlayers}
      />
      <PanelTabButton
        tab="night-order"
        icon={<Moon />}
        label="Night order"
        active={nightOpen}
        onClick={onOpenNight}
      />
    </nav>
  );

  if (pendingReminder) {
    return (
      <>
        {panelTabs}
        <section
          className={cn(
            "storyteller-context-drawer reminder-placement-dock",
            nightOpen && "is-sheet-adjacent",
          )}
          aria-label={`Place ${pendingReminder.label}`}
        >
          <div className="storyteller-dock player-dock" role="toolbar">
            <ReminderToken
              label={pendingReminder.label}
              roleId={pendingReminder.roleId}
              size="tray"
            />
            <div className="player-inspector-identity">
              <strong>Place {pendingReminder.label}</strong>
              <span>{pendingReminder.sourceName}</span>
            </div>
            <Button
              size="sm"
              variant="quiet"
              onClick={onCancelReminderPlacement}
            >
              Cancel
            </Button>
          </div>
        </section>
      </>
    );
  }

  if (selectedReminder) {
    const selectedRole = selectedReminder.roleId
      ? roleById.get(selectedReminder.roleId)
      : null;
    return (
      <>
        {panelTabs}
        <section
          className="storyteller-context-drawer reminder-inspector-dock"
          aria-label={`${selectedReminder.label} reminder controls`}
        >
          <div className="storyteller-dock player-dock" role="toolbar">
            <ReminderToken
              label={selectedReminder.label}
              roleId={selectedReminder.roleId}
              size="tray"
              selected
            />
            <div className="player-inspector-identity">
              <strong>{selectedReminder.label}</strong>
              <span>
                {selectedRole?.name ?? "General"}
                {reminderOwner ? ` · ${reminderOwner.playerName}` : ""}
              </span>
            </div>
            <ConfirmRemoveButton
              itemLabel={`${selectedReminder.label} reminder`}
              idleLabel="Remove reminder"
              onRemove={onRemoveSelectedReminder}
            />
            <IconButton
              label="Close reminder controls"
              variant="quiet"
              tooltip={false}
              onClick={onCloseSelectedReminder}
            >
              <X className="size-4" />
            </IconButton>
          </div>
        </section>
      </>
    );
  }

  if (!seat) return panelTabs;

  const roleReminderDefinitions = getRoleReminderDefinitions(role ?? null);
  const placedCounts = reminders.reduce((counts, reminder) => {
    const key = getReminderKey(reminder);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  return (
    <>
      {panelTabs}
      <section
        className={cn(
          "storyteller-context-drawer",
          (remindersOpen || detailsOpen) && "is-expanded",
        )}
        aria-label={`${seat.playerName} controls`}
      >
        {remindersOpen && (
          <div
            className="drawer-expansion reminder-fan"
            aria-label="Reminder tokens"
          >
            <header>
              <div>
                <span className="utility-label">
                  Reminders · {seat.playerName}
                </span>
                <strong>Add to token</strong>
              </div>
              <IconButton
                label="Close reminders"
                size="sm"
                variant="quiet"
                tooltip={false}
                onClick={() => setRemindersOpen(false)}
              >
                <X className="size-4" />
              </IconButton>
            </header>
            {reminders.length > 0 && (
              <div
                className="active-reminder-list"
                aria-label={`Reminders on ${seat.playerName}`}
              >
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="active-reminder-item">
                    <ReminderToken
                      label={reminder.label}
                      roleId={reminder.roleId}
                      size="inline"
                    />
                    <span>{reminder.label}</span>
                    <IconButton
                      label={`Remove ${reminder.label}`}
                      size="sm"
                      variant="quiet"
                      tooltipSide="top"
                      onClick={() => onRemoveReminder(reminder.id)}
                    >
                      <X className="size-3" />
                    </IconButton>
                  </div>
                ))}
              </div>
            )}
            <div className="reminder-choice-sections">
              {roleReminderDefinitions.length > 0 && (
                <ReminderChoiceSection
                  label={role?.name ?? "Character"}
                  definitions={roleReminderDefinitions}
                  placedCounts={placedCounts}
                  onAddReminder={onAddReminder}
                />
              )}
              <ReminderChoiceSection
                label="General"
                definitions={generalReminderDefinitions}
                placedCounts={placedCounts}
                onAddReminder={onAddReminder}
              />
            </div>
          </div>
        )}

        {detailsOpen && (
          <div
            className="drawer-expansion player-details"
            aria-label={`${seat.playerName} details`}
          >
            <div className="detail-control">
              <span className="utility-label">Alignment</span>
              <SegmentedControl
                value={seat.alignment}
                label="Alignment"
                options={[
                  { value: "good", label: "Good" },
                  { value: "evil", label: "Evil" },
                ]}
                onChange={onSetAlignment}
              />
            </div>
            <span className="detail-divider" />
            <RemovePlayerButton
              playerName={seat.playerName}
              onRemove={onRemovePlayer}
            />
          </div>
        )}

        <div className="storyteller-dock player-dock" role="toolbar">
          <div className="player-inspector-leading">
            <button
              type="button"
              className="dock-role-token"
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
                <Plus className="size-4" />
              )}
            </button>
            <div className="player-inspector-identity">
              <strong>{seat.playerName}</strong>
              <span>
                {role?.name ?? "Choose character"} · Seat {seat.seatIndex + 1}
              </span>
            </div>
          </div>

          <span className="dock-divider" />
          <DockButton
            icon={seat.alive ? <Skull /> : <UserRoundCog />}
            label={seat.alive ? "Mark dead" : "Revive"}
            onClick={() => onSetAlive(!seat.alive)}
          />
          {!seat.alive && (
            <DockButton
              icon={<Vote />}
              label={seat.ghostVoteAvailable ? "Use vote" : "Restore vote"}
              active={!seat.ghostVoteAvailable}
              onClick={() => onSetGhostVote(!seat.ghostVoteAvailable)}
            />
          )}
          <DockButton
            icon={<CircleDot />}
            label={`Reminders${reminders.length ? ` · ${reminders.length}` : ""}`}
            active={remindersOpen}
            onClick={() => {
              setDetailsOpen(false);
              setRemindersOpen((current) => !current);
            }}
          />
          <DockButton
            icon={<UserRoundCog />}
            label="Details"
            active={detailsOpen}
            onClick={() => {
              setRemindersOpen(false);
              setDetailsOpen((current) => !current);
            }}
          />
          <IconButton
            label="Close player controls"
            variant="quiet"
            tooltip={false}
            onClick={onCloseSeat}
          >
            <X className="size-4" />
          </IconButton>
        </div>
      </section>
    </>
  );
}

function ReminderChoiceSection({
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
    <section className="reminder-choice-section">
      <span className="utility-label">{label}</span>
      <div className="reminder-choice-grid">
        {definitions.map((definition) => {
          const placed = placedCounts.get(definition.key) ?? 0;
          return (
            <button
              key={definition.key}
              type="button"
              onClick={() => onAddReminder(definition)}
            >
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
              <span>{definition.label}</span>
              {placed > 0 && <small>{placed} placed</small>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DockButton({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="quiet"
      className={cn("dock-button", active && "is-active")}
      onClick={onClick}
    >
      <span className="dock-button-icon">{icon}</span>
      <span>{label}</span>
    </Button>
  );
}

function PanelTabButton({
  tab,
  icon,
  label,
  active = false,
  onClick,
}: {
  tab: "players" | "night-order";
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <IconButton
      label={label}
      tooltip={label}
      tooltipSide="left"
      variant="quiet"
      className={cn("panel-tab-button", active && "is-active")}
      data-panel-tab={tab}
      onClick={onClick}
    >
      <span className="panel-tab-surface">
        <span className="panel-tab-icon">{icon}</span>
        <span className="panel-tab-label">{label}</span>
      </span>
    </IconButton>
  );
}
