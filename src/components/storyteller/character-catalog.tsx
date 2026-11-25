"use client";

import { useId, useState } from "react";

import {
  CharacterOption,
  type ChangeCopies,
} from "@/components/storyteller/character-option";
import { CharacterTeamHeading } from "@/components/storyteller/character-team-heading";
import {
  countRoleCopies,
  getRolesByTeam,
  getTravellerRoleGroups,
  isResidentTeam,
  getSetupRoleCopyLimit,
  roleById,
  type GameScript,
  type Team,
  type Role,
} from "@/lib/game-data";
import type { getRoleDistribution } from "@/lib/game-data/distribution";
import type { Seat } from "@/lib/game-data/types";
import { DRUNK_ROLE_ID } from "@/lib/setup-effects";
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
      distribution: ReturnType<typeof getRoleDistribution>;
      seats: readonly Seat[];
      onChangeCopies: ChangeCopies;
    };

export type CharacterCatalogProps = CatalogSelection & {
  editionId: GameScript;
  teams: readonly Team[];
  onSelect: (roleId: string) => void;
};

export function CharacterCatalog({
  editionId,
  teams,
  onSelect,
  ...selection
}: CharacterCatalogProps) {
  const grouped = getRolesByTeam(editionId);
  const pool = selection.selectionMode === "multiple" ? selection : undefined;
  const assignment =
    selection.selectionMode === "single" ? selection : undefined;
  const copies = countRoleCopies(
    pool?.selectedRoleIds ??
      (assignment?.selectedRoleId ? [assignment.selectedRoleId] : []),
  );
  const travellerContentId = useId();
  const [travellersOpen, setTravellersOpen] = useState(
    roleById.get(assignment?.selectedRoleId ?? "")?.team === "traveller",
  );

  function renderRole(role: Role) {
    const count = copies.get(role.id) ?? 0;
    const fixedCount = pool?.distribution.fixedCopies.get(role.id) ?? 0;
    let assignmentLabel: string | undefined;
    if (pool && fixedCount > 0) {
      const names = pool.seats
        .filter((seat) => seat.roleId === role.id)
        .map((seat) => seat.playerName);
      assignmentLabel = names.length
        ? `Assigned to ${names.join(", ")}`
        : "In setup";
    }
    const cannotAdd =
      !!pool &&
      (pool.distribution.unassignedCount === 0 ||
        fixedCount + count >= getSetupRoleCopyLimit(role.id) ||
        (pool.distribution.dealtRoles.length >=
          pool.distribution.unassignedCount &&
          role.id !== DRUNK_ROLE_ID));
    return (
      <CharacterOption
        key={role.id}
        role={role}
        selectionMode={selection.selectionMode}
        count={count}
        fixedCount={fixedCount}
        assignmentLabel={assignmentLabel}
        cannotAdd={cannotAdd}
        inPlay={assignment?.usedRoleIds.includes(role.id) ?? false}
        bluff={assignment?.bluffRoleIds.includes(role.id) ?? false}
        onSelect={onSelect}
        onChangeCopies={pool?.onChangeCopies}
      />
    );
  }

  return (
    <div className="character-catalog">
      {teams.map((team) => {
        const isTraveller = team === "traveller";
        const roleGroups = isTraveller
          ? getTravellerRoleGroups(editionId)
          : [{ label: teamHeadings[team], roles: grouped[team] }];
        const teamCount =
          pool && isResidentTeam(team)
            ? {
                selected: pool.distribution.teamCounts[team],
                target: pool.distribution.targetTeamCounts?.[team],
              }
            : undefined;

        return (
          <section
            key={team}
            className={cn(
              "token-team",
              `team-${team}`,
              isTraveller && "is-collapsible",
            )}
          >
            <CharacterTeamHeading
              label={teamHeadings[team]}
              count={teamCount}
              detail={
                isTraveller && pool?.distribution.travellerCount
                  ? `${pool.distribution.travellerCount} in setup`
                  : undefined
              }
              disclosure={
                isTraveller
                  ? {
                      expanded: travellersOpen,
                      contentId: travellerContentId,
                      onToggle: () => setTravellersOpen((open) => !open),
                    }
                  : undefined
              }
            />
            <div
              id={isTraveller ? travellerContentId : undefined}
              hidden={isTraveller && !travellersOpen}
            >
              {(!isTraveller || travellersOpen) &&
                roleGroups.map(({ label, roles }) => (
                  <div key={label}>
                    {isTraveller && (
                      <h4 className="traveller-script-label">{label}</h4>
                    )}
                    {roles.length === 0 && (
                      <p className="token-team-empty">No Matches</p>
                    )}
                    <div className="token-grid">{roles.map(renderRole)}</div>
                  </div>
                ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
