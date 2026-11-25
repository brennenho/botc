import { DRUNK_ROLE_ID, getSetupRoleIds } from "@/lib/setup-effects";

import {
  getEditionRoles,
  getTravellerRoles,
  isResidentTeam,
  isTravellerRole,
  roleById,
} from "./catalog";
import {
  countRoleCopies,
  getLegionSetupIssue,
  getSetupRoleCopyLimit,
  getSetupSelectionTargetCounts,
} from "./setup";
import type { GameScript, GameToken, Seat, TeamCounts } from "./types";

export function getRoleDistribution(
  edition: GameScript,
  seats: readonly Seat[],
  gameTokens: readonly GameToken[],
  selectedRoleIds: readonly string[],
) {
  const assigned = seats.flatMap((seat) => (seat.roleId ? [seat.roleId] : []));
  const unassignedCount = seats.length - assigned.length;
  const drunkMarker =
    getSetupRoleIds(gameTokens).includes(DRUNK_ROLE_ID) &&
    !assigned.includes(DRUNK_ROLE_ID);
  const fixedRoles = drunkMarker ? [...assigned, DRUNK_ROLE_ID] : assigned;
  const allRoles = [...fixedRoles, ...selectedRoleIds];
  const travellerCount = allRoles.filter(isTravellerRole).length;
  const residents = seats.length - travellerCount;
  const dealtRoles = selectedRoleIds.filter((id) => id !== DRUNK_ROLE_ID);
  const teamCounts: TeamCounts = {
    townsfolk: 0,
    outsider: 0,
    minion: 0,
    demon: 0,
  };
  for (const id of allRoles) {
    const role = roleById.get(id);
    if (role && isResidentTeam(role.team)) teamCounts[role.team]++;
  }
  const targetTeamCounts = getSetupSelectionTargetCounts(
    residents,
    allRoles,
    drunkMarker || selectedRoleIds.includes(DRUNK_ROLE_ID),
  );
  const allowed = new Set(
    [
      ...getEditionRoles(edition).filter((role) => isResidentTeam(role.team)),
      ...getTravellerRoles(edition),
    ].map((role) => role.id),
  );
  const copies = countRoleCopies(allRoles);
  const invalidRole = selectedRoleIds.find(
    (id) =>
      !allowed.has(id) || (copies.get(id) ?? 0) > getSetupRoleCopyLimit(id),
  );
  const complete = unassignedCount > 0 && dealtRoles.length === unassignedCount;
  const issue = invalidRole
    ? `Remove ${roleById.get(invalidRole)?.name ?? "the unavailable role"} from the selection.`
    : dealtRoles.length > unassignedCount
      ? "Remove roles to match the remaining seats."
      : complete
        ? getLegionSetupIssue(allRoles, residents)
        : null;

  return {
    fixedCopies: countRoleCopies(fixedRoles),
    teamCounts,
    travellerCount,
    targetTeamCounts,
    unassignedCount,
    dealtRoles,
    issue,
    ready: complete && !issue,
  };
}
