"use client";

import { Shuffle } from "lucide-react";
import { useEffect, useState } from "react";

import { CharacterSelectionDialog } from "@/components/storyteller/character-selection-dialog";
import { Button } from "@/components/ui/button";
import {
  getSetupSelectionTargetCounts,
  type EditionId,
  type TeamCounts,
} from "@/lib/game-data";
import { DRUNK_ROLE_ID } from "@/lib/setup-effects";

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
  const drunkSelected = selectedRoleIds.includes(DRUNK_ROLE_ID);
  const selectionTarget = playerCount + (drunkSelected ? 1 : 0);
  const targetTeamCounts =
    getSetupSelectionTargetCounts(playerCount, selectedRoleIds) ??
    emptyDefaultCounts;
  const selectionComplete = selectedRoleIds.length === selectionTarget;

  function toggleRole(roleId: string) {
    setSelectedRoleIds((current) => {
      if (current.includes(roleId)) {
        return current.filter((id) => id !== roleId);
      }
      const currentTarget =
        playerCount + (current.includes(DRUNK_ROLE_ID) ? 1 : 0);
      if (current.length >= currentTarget && roleId !== DRUNK_ROLE_ID)
        return current;
      return [...current, roleId];
    });
  }

  return (
    <CharacterSelectionDialog
      open={open}
      editionId={editionId}
      title="Distribute Roles"
      closeLabel="Close Role Distribution"
      selectionMode="multiple"
      selectedRoleIds={selectedRoleIds}
      selectionLimit={selectionTarget}
      expandableRoleIds={[DRUNK_ROLE_ID]}
      targetTeamCounts={targetTeamCounts}
      onOpenChange={onOpenChange}
      onSelect={toggleRole}
      footer={
        <footer className="pool-case-footer">
          <div className="pool-summary">
            <div className="pool-summary-line">
              <strong>
                {selectedRoleIds.length} of {selectionTarget} Selected
              </strong>
              {selectedRoleIds.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="quiet"
                  className="pool-clear-button"
                  onClick={() => setSelectedRoleIds([])}
                >
                  Clear
                </Button>
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
            Distribute Roles
          </Button>
        </footer>
      }
    />
  );
}
