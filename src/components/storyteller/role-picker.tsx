"use client";

import { X } from "lucide-react";

import { CharacterSelectionDialog } from "@/components/storyteller/character-selection-dialog";
import { Button } from "@/components/ui/button";
import type { EditionId, Team } from "@/lib/game-data";

export function RolePicker({
  open,
  editionId,
  title = "Choose a Character",
  clearLabel = "Clear Assignment",
  selectedRoleId,
  usedRoleIds,
  bluffRoleIds,
  teams,
  collapsibleTeams,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  editionId: EditionId;
  title?: string;
  clearLabel?: string;
  selectedRoleId: string | null;
  usedRoleIds: string[];
  bluffRoleIds: string[];
  teams: readonly Team[];
  collapsibleTeams?: readonly Team[];
  onOpenChange: (open: boolean) => void;
  onSelect: (roleId: string | null) => void;
}) {
  return (
    <CharacterSelectionDialog
      open={open}
      editionId={editionId}
      title={title}
      closeLabel="Close Character Picker"
      selectionMode="single"
      selectedRoleIds={selectedRoleId ? [selectedRoleId] : []}
      usedRoleIds={usedRoleIds}
      bluffRoleIds={bluffRoleIds}
      teams={teams}
      collapsibleTeams={collapsibleTeams}
      onOpenChange={onOpenChange}
      onSelect={onSelect}
      footer={
        selectedRoleId ? (
          <footer className="pool-case-footer single-selection-footer">
            <Button
              variant="quiet"
              className="clear-selection-button"
              onClick={() => onSelect(null)}
            >
              <X className="size-4" />
              {clearLabel}
            </Button>
          </footer>
        ) : undefined
      }
    />
  );
}
