"use client";

import { RoleArtwork } from "@/components/grimoire/role-artwork";
import { RoleInfoButton } from "@/components/grimoire/role-info-button";
import {
  getRolesByTeam,
  teamLabel,
  type EditionId,
  type ResidentTeam,
  type TeamCounts,
} from "@/lib/game-data";
import { cn } from "@/lib/utils";

const teams: ResidentTeam[] = ["townsfolk", "outsider", "minion", "demon"];

export function CharacterCatalog({
  editionId,
  selectedRoleIds,
  usedRoleIds = [],
  selectionMode = "single",
  selectionLimit,
  defaultTeamCounts,
  onSelect,
}: {
  editionId: EditionId;
  selectedRoleIds: string[];
  usedRoleIds?: string[];
  selectionMode?: "single" | "multiple";
  selectionLimit?: number;
  defaultTeamCounts?: TeamCounts;
  onSelect: (roleId: string) => void;
}) {
  const grouped = getRolesByTeam(editionId);

  return (
    <div className={cn("character-catalog", `selection-${selectionMode}`)}>
      {teams.map((team) => {
        const roles = grouped[team];
        const selectedCount = roles.filter((role) =>
          selectedRoleIds.includes(role.id),
        ).length;

        return (
          <section key={team} className={cn("token-team", `team-${team}`)}>
            <h3>
              <span>{teamLabel(team)}</span>
              {selectionMode === "multiple" && defaultTeamCounts && (
                <span
                  className="token-team-count"
                  aria-label={`${selectedCount} selected, ${defaultTeamCounts[team]} in the default setup`}
                >
                  <strong>{selectedCount}</strong>
                  <span aria-hidden="true">/</span>
                  <span>{defaultTeamCounts[team]} default</span>
                </span>
              )}
            </h3>
            {roles.length > 0 ? (
              <div className="token-grid">
                {roles.map((role) => {
                  const used = usedRoleIds.includes(role.id);
                  const selected = selectedRoleIds.includes(role.id);
                  const selectionUnavailable =
                    selectionMode === "multiple" &&
                    !selected &&
                    selectionLimit !== undefined &&
                    selectedRoleIds.length >= selectionLimit;
                  const stateClasses = {
                    "is-used": selectionMode === "single" && used && !selected,
                    "is-selected": selectionMode === "single" && selected,
                    "is-pool-included":
                      selectionMode === "multiple" && selected,
                    "is-pool-excluded":
                      selectionMode === "multiple" && !selected,
                    "is-selection-unavailable": selectionUnavailable,
                  };

                  return (
                    <div
                      key={role.id}
                      className={cn("role-choice-item", stateClasses)}
                    >
                      <button
                        type="button"
                        className={cn("role-choice", stateClasses)}
                        aria-label={role.name}
                        aria-pressed={
                          selectionMode === "multiple" ? selected : undefined
                        }
                        disabled={selectionUnavailable}
                        onClick={() => onSelect(role.id)}
                      >
                        <RoleArtwork role={role} size="compact" />
                        {selectionMode === "single" && used && (
                          <span className="role-choice-state">In play</span>
                        )}
                      </button>
                      <div className="role-choice-caption">
                        <span className="role-choice-name">{role.name}</span>
                        <RoleInfoButton role={role} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="token-team-empty">No matches</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
