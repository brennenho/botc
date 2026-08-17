"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { CharacterCatalog } from "@/components/storyteller/character-catalog";
import { IconButton } from "@/components/ui/icon-button";
import type { EditionId, Team, TeamCounts } from "@/lib/game-data";

export function CharacterSelectionDialog({
  open,
  editionId,
  title,
  closeLabel,
  selectionMode,
  selectedRoleIds,
  usedRoleIds = [],
  bluffRoleIds = [],
  selectionLimit,
  expandableRoleIds,
  targetTeamCounts,
  teams,
  collapsibleTeams,
  teamDetails,
  unavailableRoleIds,
  footer,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  editionId: EditionId;
  title: string;
  closeLabel: string;
  selectionMode: "single" | "multiple";
  selectedRoleIds: string[];
  usedRoleIds?: string[];
  bluffRoleIds?: string[];
  selectionLimit?: number;
  expandableRoleIds?: string[];
  targetTeamCounts?: TeamCounts;
  teams: readonly Team[];
  collapsibleTeams?: readonly Team[];
  teamDetails?: Partial<Record<Team, string>>;
  unavailableRoleIds?: readonly string[];
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
  onSelect: (roleId: string) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Viewport className="dialog-viewport">
          <Dialog.Popup className="token-case pool-case">
            <header className="token-case-header">
              <Dialog.Title>{title}</Dialog.Title>
              <IconButton
                label={closeLabel}
                variant="quiet"
                size="sm"
                tooltip={false}
                className="token-case-close"
                onClick={() => onOpenChange(false)}
              >
                <X className="size-4" />
              </IconButton>
            </header>

            <div className="token-case-scroll">
              <CharacterCatalog
                editionId={editionId}
                selectedRoleIds={selectedRoleIds}
                usedRoleIds={usedRoleIds}
                bluffRoleIds={bluffRoleIds}
                selectionMode={selectionMode}
                selectionLimit={selectionLimit}
                expandableRoleIds={expandableRoleIds}
                targetTeamCounts={targetTeamCounts}
                teams={teams}
                collapsibleTeams={collapsibleTeams}
                teamDetails={teamDetails}
                unavailableRoleIds={unavailableRoleIds}
                onSelect={onSelect}
              />
            </div>

            {footer}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
