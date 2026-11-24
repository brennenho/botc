"use client";

import { useEffect, useId, useState } from "react";

import {
  CharacterOption,
  type ChangeCopies,
} from "@/components/storyteller/character-option";
import { CharacterTeamHeading } from "@/components/storyteller/character-team-heading";
import {
  getCrossEditionTravellerRoles,
  countRoleCopies,
  getRolesByTeam,
  isResidentTeam,
  type GameScript,
  type Role,
  type Team,
  type TeamCounts,
} from "@/lib/game-data";
import { cn } from "@/lib/utils";

const teamHeadings: Record<Team, string> = {
  townsfolk: "Townsfolk",
  outsider: "Outsiders",
  minion: "Minions",
  demon: "Demons",
  traveller: "Travellers",
  fabled: "Fabled",
  loric: "Loric",
};

type CatalogSelection =
  | {
      selectionMode: "single";
      selectedRoleId: string | null;
      usedRoleIds: readonly string[];
      bluffRoleIds: readonly string[];
    }
  | {
      selectionMode: "multiple";
      selectedRoleIds: string[];
      selectionLimit: number;
      expandableRoleIds: readonly string[];
      targetTeamCounts: TeamCounts;
      unavailableRoleIds: readonly string[];
      onChangeCopies: ChangeCopies;
    };

export type CharacterCatalogProps = CatalogSelection & {
  editionId: GameScript;
  teams: readonly Team[];
  collapsibleTeams?: readonly Team[];
  teamDetails?: Partial<Record<Team, string>>;
  onSelect: (roleId: string) => void;
};

export function CharacterCatalog({
  editionId,
  teams,
  collapsibleTeams = [],
  teamDetails = {},
  onSelect,
  ...selection
}: CharacterCatalogProps) {
  const grouped = getRolesByTeam(editionId);
  const pool = selection.selectionMode === "multiple" ? selection : undefined;
  const assignment =
    selection.selectionMode === "single" ? selection : undefined;
  const selectedRoleIds =
    pool?.selectedRoleIds ??
    (assignment?.selectedRoleId ? [assignment.selectedRoleId] : []);
  const copies = countRoleCopies(selectedRoleIds);
  const catalogGroups = teams.flatMap<{
    key: string;
    team: Team;
    roles: Role[];
    label: string;
    detail?: string;
    collapsible: boolean;
  }>((team) => {
    const group = {
      key: team,
      team,
      roles: grouped[team],
      label: teamHeadings[team],
      detail: teamDetails[team],
      collapsible: collapsibleTeams.includes(team),
    };
    if (team !== "traveller" || !group.collapsible) return [group];

    const otherTravellers = getCrossEditionTravellerRoles(editionId);
    if (!group.roles.length) return [{ ...group, roles: otherTravellers }];
    if (!otherTravellers.length) return [group];
    return [
      group,
      {
        ...group,
        key: "traveller-other",
        roles: otherTravellers,
        label: "Other Travellers",
        detail: `${otherTravellers.length} from other scripts`,
      },
    ];
  });
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

  function toggleGroup(key: string) {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="character-catalog">
      {catalogGroups.map((group) => {
        const { key, team, roles, label, detail, collapsible } = group;
        const teamCount =
          pool && isResidentTeam(team)
            ? {
                selected: roles.reduce(
                  (total, role) => total + (copies.get(role.id) ?? 0),
                  0,
                ),
                target: pool.targetTeamCounts[team],
              }
            : undefined;
        const expanded = !collapsible || expandedGroups.has(key);
        const visibleRoles = expanded ? roles : [];
        const contentId = `${catalogId}-${key}`;

        return (
          <section
            key={key}
            className={cn(
              "token-team",
              `team-${team}`,
              collapsible && "is-collapsible",
            )}
          >
            <CharacterTeamHeading
              label={label}
              detail={detail}
              count={teamCount}
              disclosure={
                collapsible
                  ? { expanded, contentId, onToggle: () => toggleGroup(key) }
                  : undefined
              }
            />
            {roles.length > 0 ? (
              <div id={contentId} className="token-grid" hidden={!expanded}>
                {visibleRoles.map((role) => {
                  const cannotAdd =
                    !!pool &&
                    (pool.unavailableRoleIds.includes(role.id) ||
                      (pool.selectedRoleIds.length >= pool.selectionLimit &&
                        !pool.expandableRoleIds.includes(role.id)));
                  return (
                    <CharacterOption
                      key={role.id}
                      role={role}
                      selectionMode={selection.selectionMode}
                      count={copies.get(role.id) ?? 0}
                      cannotAdd={cannotAdd}
                      inPlay={
                        assignment?.usedRoleIds.includes(role.id) ?? false
                      }
                      bluff={
                        assignment?.bluffRoleIds.includes(role.id) ?? false
                      }
                      onSelect={onSelect}
                      onChangeCopies={pool?.onChangeCopies}
                    />
                  );
                })}
              </div>
            ) : (
              <p id={contentId} className="token-team-empty" hidden={!expanded}>
                No Matches
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
