"use client";

import { CharacterSelectionDialog } from "@/components/storyteller/character-selection-dialog";
import type { EditionId, Team } from "@/lib/game-data";

export function RolePicker({
  open,
  editionId,
  title = "Choose a Character",
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
  selectedRoleId: string | null;
  usedRoleIds: string[];
  bluffRoleIds: string[];
  teams: readonly Team[];
  collapsibleTeams?: readonly Team[];
  onOpenChange: (open: boolean) => void;
  onSelect: (roleId: string) => void;
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
    />
  );
}
