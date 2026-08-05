"use client";

import { useEffect, useState } from "react";
import {
  CircleDot,
  Moon,
  Plus,
  Skull,
  Trash2,
  UserRoundCog,
  Users,
  Vote,
  X,
} from "lucide-react";

import { RoleArtwork } from "@/components/grimoire/role-artwork";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { roleById } from "@/lib/game-data";
import type { Alignment, GameToken, Seat } from "@/lib/game-data/types";
import { cn } from "@/lib/utils";

const generalReminders = ["Poisoned", "Drunk", "Mad", "Is the Demon"];

export function StorytellerDock({
  seat,
  reminders,
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
}: {
  seat: Seat | null;
  reminders: GameToken[];
  playersOpen: boolean;
  nightOpen: boolean;
  onCloseSeat: () => void;
  onOpenPlayers: () => void;
  onOpenNight: () => void;
  onChooseRole: () => void;
  onSetAlive: (alive: boolean) => void;
  onSetAlignment: (alignment: Alignment) => void;
  onSetGhostVote: (available: boolean) => void;
  onAddReminder: (label: string, roleId: string | null) => void;
  onRemoveReminder: (tokenId: string) => void;
  onRemovePlayer: () => void;
}) {
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const role = seat?.roleId ? roleById.get(seat.roleId) : null;

  useEffect(() => {
    setRemindersOpen(false);
    setDetailsOpen(false);
    setConfirmRemove(false);
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

  if (!seat) return panelTabs;

  const reminderChoices = [...(role?.reminders ?? []), ...generalReminders];

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
              <div className="active-token-strip" aria-label="Active reminders">
                {reminders.map((reminder) => (
                  <button
                    key={reminder.id}
                    type="button"
                    onClick={() => onRemoveReminder(reminder.id)}
                  >
                    <span>{reminder.label}</span>
                    <X className="size-3.5" />
                  </button>
                ))}
              </div>
            )}
            <div className="reminder-choice-grid">
              {reminderChoices.map((label, index) => {
                const isRoleReminder = index < (role?.reminders.length ?? 0);
                return (
                  <button
                    key={`${label}-${index}`}
                    type="button"
                    onClick={() =>
                      onAddReminder(
                        label,
                        isRoleReminder ? (role?.id ?? null) : null,
                      )
                    }
                  >
                    <span className="reminder-choice-token">
                      {isRoleReminder && role ? (
                        <RoleArtwork role={role} size="tiny" showName={false} />
                      ) : (
                        <CircleDot aria-hidden="true" />
                      )}
                    </span>
                    <span>{label}</span>
                  </button>
                );
              })}
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
            {confirmRemove ? (
              <div className="remove-confirm">
                <span>Remove {seat.playerName}?</span>
                <Button
                  size="sm"
                  variant="quiet"
                  onClick={() => setConfirmRemove(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" variant="danger" onClick={onRemovePlayer}>
                  Remove
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="danger"
                onClick={() => setConfirmRemove(true)}
              >
                <Trash2 className="size-4" />
                Remove player
              </Button>
            )}
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
