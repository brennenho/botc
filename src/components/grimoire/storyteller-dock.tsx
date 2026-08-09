"use client";

import { Moon, Users, X } from "lucide-react";

import { RevealIcon } from "@/components/grimoire/reveal-icon";
import { ReminderIcon } from "@/components/grimoire/reminder-icon";
import { ReminderToken } from "@/components/grimoire/reminder-token";
import { ConfirmRemoveButton } from "@/components/grimoire/remove-player-button";
import { IconButton } from "@/components/ui/icon-button";
import { roleById } from "@/lib/game-data";
import type { GameToken, Seat } from "@/lib/game-data/types";
import type { ReminderDefinition } from "@/lib/reminders";
import { cn } from "@/lib/utils";

export function StorytellerDock({
  selectedReminder,
  reminderOwner,
  pendingReminder,
  playersOpen,
  nightOpen,
  showOpen,
  onOpenPlayers,
  onOpenNight,
  onOpenShow,
  onRemoveSelectedReminder,
  onCloseSelectedReminder,
  onCancelReminderPlacement,
}: {
  selectedReminder: GameToken | null;
  reminderOwner: Seat | null;
  pendingReminder: ReminderDefinition | null;
  playersOpen: boolean;
  nightOpen: boolean;
  showOpen: boolean;
  onOpenPlayers: () => void;
  onOpenNight: () => void;
  onOpenShow: () => void;
  onRemoveSelectedReminder: () => void;
  onCloseSelectedReminder: () => void;
  onCancelReminderPlacement: () => void;
}) {
  const panelTabs = (
    <nav
      className={cn(
        "storyteller-dock global-dock",
        (playersOpen || nightOpen || showOpen) && "is-sheet-open",
      )}
      aria-label="Grimoire Panels"
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
        label="Night Order"
        active={nightOpen}
        onClick={onOpenNight}
      />
      <PanelTabButton
        tab="show"
        icon={<RevealIcon />}
        label="Show"
        active={showOpen}
        onClick={onOpenShow}
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
          aria-live="polite"
        >
          <div className="storyteller-dock player-dock" role="toolbar">
            <span className="reminder-placement-icon">
              <ReminderIcon />
            </span>
            <div className="player-inspector-identity">
              <strong>Place {pendingReminder.label}</strong>
              <span>Select a Player Token · {pendingReminder.sourceName}</span>
            </div>
            <IconButton
              label="Cancel Reminder Placement"
              variant="quiet"
              tooltipSide="top"
              onClick={onCancelReminderPlacement}
            >
              <X className="size-4" />
            </IconButton>
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
              itemLabel={`${selectedReminder.label} Reminder`}
              idleLabel="Remove Reminder"
              onRemove={onRemoveSelectedReminder}
            />
            <IconButton
              label="Close Reminder Controls"
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

  return panelTabs;
}

function PanelTabButton({
  tab,
  icon,
  label,
  active = false,
  onClick,
}: {
  tab: "players" | "night-order" | "show";
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
      focusStyle="surface"
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
