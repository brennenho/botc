"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { CharacterToken } from "@/components/grimoire/character-token";
import { RoleInfoButton } from "@/components/storyteller/role-info-button";
import { Button } from "@/components/ui/button";
import {
  getRolesByTeam,
  teamLabel,
  type EditionId,
  type Team,
  type TeamCounts,
} from "@/lib/game-data";
import { cn } from "@/lib/utils";

export function CharacterCatalog({
  editionId,
  selectedRoleIds,
  usedRoleIds = [],
  bluffRoleIds = [],
  selectionMode = "single",
  selectionLimit,
  expandableRoleIds = [],
  targetTeamCounts,
  teams,
  collapsibleTeams = [],
  collapsibleTeamDetails = {},
  unavailableRoleIds = [],
  onSelect,
}: {
  editionId: EditionId;
  selectedRoleIds: string[];
  usedRoleIds?: string[];
  bluffRoleIds?: string[];
  selectionMode?: "single" | "multiple";
  selectionLimit?: number;
  expandableRoleIds?: string[];
  targetTeamCounts?: TeamCounts;
  teams: readonly Team[];
  collapsibleTeams?: readonly Team[];
  collapsibleTeamDetails?: Partial<Record<Team, string>>;
  unavailableRoleIds?: readonly string[];
  onSelect: (roleId: string) => void;
}) {
  const grouped = getRolesByTeam(editionId);
  const hasMultipleDemons = grouped.demon.length > 1;
  const catalogId = useId();
  const [expandedTeams, setExpandedTeams] = useState<Set<Team>>(
    () => new Set(),
  );
  const selectedCollapsibleTeams = collapsibleTeams.filter((team) =>
    grouped[team].some((role) => selectedRoleIds.includes(role.id)),
  );
  const selectedCollapsibleTeamKey = selectedCollapsibleTeams.join("|");

  useEffect(() => {
    if (!selectedCollapsibleTeamKey) return;
    const selectedTeams = selectedCollapsibleTeamKey.split("|") as Team[];
    setExpandedTeams((current) => {
      const next = new Set(current);
      selectedTeams.forEach((team) => next.add(team));
      return next;
    });
  }, [selectedCollapsibleTeamKey]);

  return (
    <div
      className={cn(
        "character-catalog",
        `selection-${selectionMode}`,
        hasMultipleDemons && "has-multiple-demons",
      )}
    >
      {teams.map((team) => {
        const roles = grouped[team];
        const selectedCount = roles.filter((role) =>
          selectedRoleIds.includes(role.id),
        ).length;
        const collapsible = collapsibleTeams.includes(team);
        const expanded = !collapsible || expandedTeams.has(team);
        const contentId = `${catalogId}-${team}`;

        return (
          <section
            key={team}
            className={cn(
              "token-team",
              `team-${team}`,
              collapsible && "is-collapsible",
              !expanded && "is-collapsed",
            )}
          >
            <h3>
              {collapsible ? (
                <button
                  type="button"
                  className="token-team-toggle"
                  aria-expanded={expanded}
                  aria-controls={contentId}
                  onClick={() =>
                    setExpandedTeams((current) => {
                      const next = new Set(current);
                      if (next.has(team)) next.delete(team);
                      else next.add(team);
                      return next;
                    })
                  }
                >
                  <span className="token-team-toggle-copy">
                    <span>
                      {team === "traveller" ? "Travellers" : teamLabel(team)}
                    </span>
                    <small>
                      {collapsibleTeamDetails[team] ??
                        `Optional · ${roles.length} characters`}
                    </small>
                  </span>
                  <ChevronDown aria-hidden="true" />
                </button>
              ) : (
                <span>{teamLabel(team)}</span>
              )}
              {team !== "traveller" &&
                selectionMode === "multiple" &&
                targetTeamCounts && (
                  <span
                    className="token-team-count"
                    aria-label={`${selectedCount} selected, ${targetTeamCounts[team]} in the current setup`}
                  >
                    <strong>{selectedCount}</strong>
                    <span aria-hidden="true">/</span>
                    <span>{targetTeamCounts[team]}</span>
                  </span>
                )}
            </h3>
            {expanded && roles.length > 0 ? (
              <div id={contentId} className="token-grid">
                {roles.map((role) => {
                  const used = usedRoleIds.includes(role.id);
                  const bluff = bluffRoleIds.includes(role.id);
                  const selected = selectedRoleIds.includes(role.id);
                  const selectionUnavailable =
                    selectionMode === "multiple" &&
                    !selected &&
                    ((selectionLimit !== undefined &&
                      selectedRoleIds.length >= selectionLimit &&
                      !expandableRoleIds.includes(role.id)) ||
                      unavailableRoleIds.includes(role.id));
                  const stateClasses = {
                    "is-used":
                      selectionMode === "single" &&
                      (used || bluff) &&
                      !selected,
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
                      <Button
                        type="button"
                        size="icon"
                        variant="quiet"
                        focusStyle="surface"
                        className={cn(
                          "role-choice tactile-action",
                          stateClasses,
                        )}
                        aria-label={`${role.name}${used ? ", in play" : ""}${bluff ? ", demon bluff" : ""}`}
                        aria-pressed={
                          selectionMode === "multiple" ? selected : undefined
                        }
                        disabled={selectionUnavailable}
                        onClick={() => onSelect(role.id)}
                      >
                        <CharacterToken
                          role={role}
                          size="lg"
                          className="tactile-surface"
                        />
                        {selectionMode === "single" && (used || bluff) && (
                          <span className="role-choice-states">
                            {used && (
                              <span className="role-choice-state is-in-play">
                                In Play
                              </span>
                            )}
                            {bluff && (
                              <span className="role-choice-state is-bluff">
                                Bluff
                              </span>
                            )}
                          </span>
                        )}
                      </Button>
                      <div className="role-choice-caption">
                        <span className="role-choice-name">{role.name}</span>
                        <RoleInfoButton role={role} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : expanded ? (
              <p className="token-team-empty">No Matches</p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
