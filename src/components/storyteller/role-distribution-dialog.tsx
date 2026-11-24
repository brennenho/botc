"use client";

import { Shuffle } from "lucide-react";
import { useEffect, useState } from "react";

import { CharacterSelectionDialog } from "@/components/storyteller/character-selection-dialog";
import { Button } from "@/components/ui/button";
import {
  getRolesByTeam,
  getLegionSetupIssue,
  getSetupSelectionTargetCounts,
  getSetupRoleCopyLimit,
  getTravellerRoles,
  roleById,
  type GameScript,
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
  editionId: GameScript;
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
  const selectedTravellerCount = selectedRoleIds.filter(
    (roleId) => roleById.get(roleId)?.team === "traveller",
  ).length;
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
    selectedTravellerCount === 0 || selectedTravellerCount === travellerCount;
  const selectionComplete =
    residentSelectionComplete && travellerSelectionComplete;
  const legionIssue = residentSelectionComplete
    ? getLegionSetupIssue(selectedResidentRoleIds, residentCount)
    : null;
  const grouped = getRolesByTeam(editionId);
  const travellerRoles = getTravellerRoles(editionId);
  const residentLimitReached =
    selectedResidentRoleIds.length >= residentSelectionTarget;
  const travellerLimitReached = selectedTravellerCount >= travellerCount;
  const unavailableRoleIds = [
    ...(residentLimitReached
      ? residentTeams.flatMap((team) =>
          grouped[team]
            .filter((role) => role.id !== DRUNK_ROLE_ID)
            .map((role) => role.id),
        )
      : []),
    ...(travellerLimitReached ? travellerRoles.map((role) => role.id) : []),
  ];
  const travellerDetail =
    travellerCount === 0
      ? "Mark a player as a Traveller first."
      : selectedTravellerCount === 0
        ? "Leave empty to keep current roles."
        : `${selectedTravellerCount} of ${travellerCount} selected`;
  const selectionHint =
    legionIssue ??
    (travellerSelectionComplete
      ? null
      : "Choose one role per Traveller, or choose none.");

  function changeSelection(
    roleId: string,
    action: "toggle" | "add" | "remove",
  ) {
    setSelectedRoleIds((current) => {
      const index = current.indexOf(roleId);
      if (action === "remove") return current.filter((_, i) => i !== index);
      if (action === "toggle" && index >= 0) {
        return current.filter((id) => id !== roleId);
      }
      const role = roleById.get(roleId);
      if (!role) return current;
      if (
        current.filter((id) => id === roleId).length >=
        getSetupRoleCopyLimit(roleId)
      )
        return current;

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
      teamDetails={{ traveller: travellerDetail }}
      unavailableRoleIds={unavailableRoleIds}
      onOpenChange={onOpenChange}
      onSelect={(id) => changeSelection(id, "toggle")}
      onChangeCopies={changeSelection}
      footer={
        <footer className="pool-case-footer">
          <div className="pool-summary">
            <div className="pool-summary-line">
              <strong>
                {selectedResidentRoleIds.length} of {residentSelectionTarget}{" "}
                resident {residentSelectionTarget === 1 ? "role" : "roles"}{" "}
                selected
              </strong>
              {selectedRoleIds.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="quiet"
                  className="pool-clear-button"
                  onClick={() => setSelectedRoleIds([])}
                >
                  Clear all
                </Button>
              )}
            </div>
            {selectionHint && <p>{selectionHint}</p>}
          </div>
          <Button
            disabled={!selectionComplete || !!legionIssue}
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
