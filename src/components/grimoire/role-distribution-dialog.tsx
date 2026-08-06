"use client";

import { Shuffle } from "lucide-react";
import { useEffect, useState } from "react";

import { CharacterSelectionDialog } from "@/components/grimoire/character-selection-dialog";
import { Button } from "@/components/ui/button";
import { setupCounts, type EditionId, type TeamCounts } from "@/lib/game-data";

const emptyDefaultCounts: TeamCounts = {
  townsfolk: 0,
  outsider: 0,
  minion: 0,
  demon: 0,
};

export function RoleDistributionDialog({
  open,
  editionId,
  playerCount,
  onOpenChange,
  onDistribute,
}: {
  open: boolean;
  editionId: EditionId;
  playerCount: number;
  onOpenChange: (open: boolean) => void;
  onDistribute: (roleIds: string[]) => void;
}) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setSelectedRoleIds([]);
  }, [open]);
  const defaultTeamCounts = setupCounts[playerCount] ?? emptyDefaultCounts;
  const selectionComplete = selectedRoleIds.length === playerCount;

  function toggleRole(roleId: string) {
    setSelectedRoleIds((current) => {
      if (current.includes(roleId)) {
        return current.filter((id) => id !== roleId);
      }
      if (current.length >= playerCount) return current;
      return [...current, roleId];
    });
  }

  return (
    <CharacterSelectionDialog
      open={open}
      editionId={editionId}
      title="Distribute roles"
      closeLabel="Close role distribution"
      selectionMode="multiple"
      selectedRoleIds={selectedRoleIds}
      selectionLimit={playerCount}
      defaultTeamCounts={defaultTeamCounts}
      onOpenChange={onOpenChange}
      onSelect={toggleRole}
      footer={
        <footer className="pool-case-footer">
          <div className="pool-summary">
            <div className="pool-summary-line">
              <strong>
                {selectedRoleIds.length} of {playerCount} selected
              </strong>
              {selectedRoleIds.length > 0 && (
                <button type="button" onClick={() => setSelectedRoleIds([])}>
                  Clear
                </button>
              )}
            </div>
          </div>
          <Button
            disabled={!selectionComplete}
            onClick={() => {
              onDistribute(selectedRoleIds);
              onOpenChange(false);
            }}
          >
            <Shuffle className="size-4" />
            Distribute roles
          </Button>
        </footer>
      }
    />
  );
}
