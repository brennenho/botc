"use client";

import { Shuffle } from "lucide-react";
import { useEffect, useState } from "react";

import { CharacterSelectionDialog } from "@/components/storyteller/character-selection-dialog";
import { Button } from "@/components/ui/button";
import {
  getRolesByTeam,
  getSetupSelectionTargetCounts,
  roleById,
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

const residentTeams = ["townsfolk", "outsider", "minion", "demon"] as const;
const assignableTeams = [...residentTeams, "traveller"] as const;

export function RoleDistributionDialog({
  open,
  editionId,
  residentCount,
  travellerCount,
  onOpenChange,
  onDistribute,
}: {
  open: boolean;
  editionId: EditionId;
  residentCount: number;
  travellerCount: number;
  onOpenChange: (open: boolean) => void;
  onDistribute: (roleIds: string[]) => void;
}) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setSelectedRoleIds([]);
  }, [open]);
  const selectedTravellerRoleIds = selectedRoleIds.filter(
    (roleId) => roleById.get(roleId)?.team === "traveller",
  );
  const selectedResidentRoleIds = selectedRoleIds.filter(
    (roleId) => roleById.get(roleId)?.team !== "traveller",
  );
  const drunkSelected = selectedResidentRoleIds.includes(DRUNK_ROLE_ID);
  const residentSelectionTarget = residentCount + (drunkSelected ? 1 : 0);
  const selectionLimit = residentSelectionTarget + travellerCount;
  const targetTeamCounts =
    getSetupSelectionTargetCounts(residentCount, selectedResidentRoleIds) ??
    emptyDefaultCounts;
  const residentSelectionComplete =
    selectedResidentRoleIds.length === residentSelectionTarget;
  const travellerSelectionComplete =
    selectedTravellerRoleIds.length === 0 ||
    selectedTravellerRoleIds.length === travellerCount;
  const selectionComplete =
    residentSelectionComplete && travellerSelectionComplete;
  const grouped = getRolesByTeam(editionId);
  const residentLimitReached =
    selectedResidentRoleIds.length >= residentSelectionTarget;
  const travellerLimitReached =
    selectedTravellerRoleIds.length >= travellerCount;
  const unavailableRoleIds = [
    ...(residentLimitReached
      ? residentTeams.flatMap((team) =>
          grouped[team]
            .filter((role) => role.id !== DRUNK_ROLE_ID)
            .map((role) => role.id),
        )
      : []),
    ...(travellerLimitReached ? grouped.traveller.map((role) => role.id) : []),
  ];
  const travellerDetail =
    travellerCount === 0
      ? "No Traveller seats · mark a player first"
      : `${selectedTravellerRoleIds.length} of ${travellerCount} selected · optional`;

  function toggleRole(roleId: string) {
    setSelectedRoleIds((current) => {
      if (current.includes(roleId)) {
        return current.filter((id) => id !== roleId);
      }
      const role = roleById.get(roleId);
      if (!role) return current;

      if (role.team === "traveller") {
        const currentTravellerCount = current.filter(
          (id) => roleById.get(id)?.team === "traveller",
        ).length;
        if (currentTravellerCount >= travellerCount) return current;
      } else {
        const currentResidentRoleIds = current.filter(
          (id) => roleById.get(id)?.team !== "traveller",
        );
        const currentTarget =
          residentCount +
          (currentResidentRoleIds.includes(DRUNK_ROLE_ID) ? 1 : 0);
        if (
          currentResidentRoleIds.length >= currentTarget &&
          roleId !== DRUNK_ROLE_ID
        ) {
          return current;
        }
      }
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
      selectionLimit={selectionLimit}
      expandableRoleIds={[DRUNK_ROLE_ID]}
      targetTeamCounts={targetTeamCounts}
      teams={assignableTeams}
      collapsibleTeams={["traveller"]}
      collapsibleTeamDetails={{ traveller: travellerDetail }}
      unavailableRoleIds={unavailableRoleIds}
      onOpenChange={onOpenChange}
      onSelect={toggleRole}
      footer={
        <footer className="pool-case-footer">
          <div className="pool-summary">
            <div className="pool-summary-line">
              <strong>
                {selectedResidentRoleIds.length} of {residentSelectionTarget}{" "}
                resident roles
                {travellerCount > 0
                  ? ` · ${selectedTravellerRoleIds.length} of ${travellerCount} Traveller roles`
                  : ""}
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
            <p>
              {travellerCount === 0
                ? "Mark a player as a Traveller to include Traveller roles."
                : selectedTravellerRoleIds.length === 0
                  ? "Traveller roles are optional; current Traveller assignments will be kept."
                  : selectedTravellerRoleIds.length === travellerCount
                    ? "Traveller roles will be shuffled only among marked Traveller seats."
                    : `Select ${travellerCount - selectedTravellerRoleIds.length} more Traveller ${travellerCount - selectedTravellerRoleIds.length === 1 ? "role" : "roles"}, or clear the Traveller selections.`}
            </p>
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
