"use client";

import { X } from "lucide-react";

import { CharacterSelectionDialog } from "@/components/grimoire/character-selection-dialog";
import { Button } from "@/components/ui/button";
import type { EditionId } from "@/lib/game-data";

export function RolePicker({
  open,
  editionId,
  title = "Choose a character",
  clearLabel = "Clear assignment",
  selectedRoleId,
  usedRoleIds,
  bluffRoleIds,
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
  onOpenChange: (open: boolean) => void;
  onSelect: (roleId: string | null) => void;
}) {
  return (
    <CharacterSelectionDialog
      open={open}
      editionId={editionId}
      title={title}
      closeLabel="Close character picker"
      selectionMode="single"
      selectedRoleIds={selectedRoleId ? [selectedRoleId] : []}
      usedRoleIds={usedRoleIds}
      bluffRoleIds={bluffRoleIds}
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
