"use client";

import { Shuffle } from "lucide-react";
import { useState } from "react";

import { CharacterSelectionDialog } from "@/components/storyteller/character-selection-dialog";
import { Button } from "@/components/ui/button";
import { getRoleDistribution } from "@/lib/game-data/distribution";
import type { GameScript, GameToken, Seat } from "@/lib/game-data/types";

const teams = [
  "townsfolk",
  "outsider",
  "minion",
  "demon",
  "traveller",
] as const;

export function RoleDistributionDialog({
  open,
  editionId,
  seats,
  gameTokens,
  onOpenChange,
  onDistribute,
}: {
  open: boolean;
  editionId: GameScript;
  seats: Seat[];
  gameTokens: GameToken[];
  onOpenChange: (open: boolean) => void;
  onDistribute: (roleIds: string[]) => void;
}) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const pool = getRoleDistribution(
    editionId,
    seats,
    gameTokens,
    selectedRoleIds,
  );
  function changeSelection(
    roleId: string,
    action: "toggle" | "add" | "remove",
  ) {
    setSelectedRoleIds((current) => {
      if (action === "remove")
        return current.filter((_, i) => i !== current.indexOf(roleId));
      if (action === "toggle" && current.includes(roleId))
        return current.filter((id) => id !== roleId);
      return [...current, roleId];
    });
  }

  return (
    <CharacterSelectionDialog
      open={open}
      title="Distribute Roles"
      closeLabel="Close Role Distribution"
      editionId={editionId}
      teams={teams}
      selectionMode="multiple"
      selectedRoleIds={selectedRoleIds}
      distribution={pool}
      onOpenChange={onOpenChange}
      onSelect={(id) => changeSelection(id, "toggle")}
      onChangeCopies={changeSelection}
      footer={
        <>
          <div className="pool-summary">
            <div className="pool-summary-line">
              <strong aria-live="polite">
                {pool.unassignedCount === 0
                  ? "All players have a role."
                  : `${pool.dealtRoles.length} selected for ${pool.unassignedCount} unassigned ${pool.unassignedCount === 1 ? "player" : "players"}`}
              </strong>
              {selectedRoleIds.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="quiet"
                  className="pool-clear-button"
                  onClick={() => setSelectedRoleIds([])}
                >
                  Clear selection
                </Button>
              )}
            </div>
            {pool.issue && <p>{pool.issue}</p>}
          </div>
          <Button
            disabled={!pool.ready}
            onClick={() => {
              onDistribute(selectedRoleIds);
              onOpenChange(false);
            }}
          >
            <Shuffle className="size-4" />
            Distribute Roles
          </Button>
        </>
      }
    />
  );
}
