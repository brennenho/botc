"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { CharacterToken } from "@/components/grimoire/character-token";
import { RoleInfoButton } from "@/components/storyteller/role-info-button";
import { Button } from "@/components/ui/button";
import {
  getCrossEditionTravellerRoles,
  getRolesByTeam,
  teamLabel,
  type EditionId,
  type Role,
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
  teamDetails = {},
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
  teamDetails?: Partial<Record<Team, string>>;
  unavailableRoleIds?: readonly string[];
  onSelect: (roleId: string) => void;
}) {
  const grouped = getRolesByTeam(editionId);
  const crossEditionTravellers = getCrossEditionTravellerRoles(editionId);
  const catalogGroups = teams.flatMap<{
    key: string;
    team: Team;
    roles: Role[];
    label: string;
    detail?: string;
    collapsible: boolean;
  }>((team) => {
    if (team !== "traveller") {
      return [
        {
          key: team,
          team,
          roles: grouped[team],
          label: teamLabel(team),
          detail: teamDetails[team],
          collapsible: collapsibleTeams.includes(team),
        },
      ];
    }

    const travellerGroups = [
      {
        key: "traveller",
        team,
        roles: grouped.traveller,
        label: "Travellers",
        detail: teamDetails.traveller,
        collapsible: false,
      },
    ];
    if (collapsibleTeams.includes("traveller")) {
      travellerGroups.push({
        key: "traveller-other",
        team,
        roles: crossEditionTravellers,
        label: "Other Travellers",
        detail: `${crossEditionTravellers.length} from other scripts`,
        collapsible: true,
      });
    }
    return travellerGroups;
  });
  const hasMultipleDemons = grouped.demon.length > 1;
  const catalogId = useId();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const selectedCollapsibleGroupKey = catalogGroups
    .filter(
      (group) =>
        group.collapsible &&
        group.roles.some((role) => selectedRoleIds.includes(role.id)),
    )
    .map((group) => group.key)
    .join("|");

  useEffect(() => {
    if (!selectedCollapsibleGroupKey) return;
    const selectedGroups = selectedCollapsibleGroupKey.split("|");
    setExpandedGroups((current) => {
      const next = new Set(current);
      selectedGroups.forEach((group) => next.add(group));
      return next;
    });
  }, [selectedCollapsibleGroupKey]);

  return (
    <div
      className={cn(
        "character-catalog",
        `selection-${selectionMode}`,
        hasMultipleDemons && "has-multiple-demons",
      )}
    >
      {catalogGroups.map((group) => {
        const { key, team, roles, label, detail, collapsible } = group;
        const selectedCount = roles.filter((role) =>
          selectedRoleIds.includes(role.id),
        ).length;
        const expanded = !collapsible || expandedGroups.has(key);
        const contentId = `${catalogId}-${key}`;

        return (
          <section
            key={key}
            className={cn(
              "token-team",
              `team-${team}`,
              key === "traveller-other" && "team-traveller-other",
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
                    setExpandedGroups((current) => {
                      const next = new Set(current);
                      if (next.has(key)) next.delete(key);
                      else next.add(key);
                      return next;
                    })
                  }
                >
                  <span className="token-team-toggle-copy">
                    <span>{label}</span>
                    {detail && <small>{detail}</small>}
                  </span>
                  <ChevronDown aria-hidden="true" />
                </button>
              ) : (
                <span className="token-team-heading">
                  <span>{label}</span>
                  {detail && <small>{detail}</small>}
                </span>
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
