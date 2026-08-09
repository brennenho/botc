import { getEditionRoles } from "./catalog";
import { getOutsiderDeltas, setupCounts } from "./setup";
import type { EditionId, ResidentTeam, Role } from "./types";

function shuffled<T>(items: readonly T[], random: () => number) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other]!, result[index]!];
  }
  return result;
}

function combinations<T>(items: readonly T[], count: number): T[][] {
  if (count === 0) return [[]];
  if (items.length < count) return [];

  return items.flatMap((item, index) =>
    combinations(items.slice(index + 1), count - 1).map((rest) => [
      item,
      ...rest,
    ]),
  );
}

export function createRandomSetup(
  edition: EditionId,
  playerCount: number,
  random: () => number = Math.random,
  allowedRoleIds?: readonly string[],
) {
  const base = setupCounts[playerCount];
  const allowed = allowedRoleIds ? new Set(allowedRoleIds) : null;
  const editionRoles = getEditionRoles(edition).filter(
    (role) => role.team !== "traveller" && (!allowed || allowed.has(role.id)),
  );

  if (allowed) {
    if (editionRoles.length !== playerCount) return [];
    return shuffled(editionRoles, random).map((role) => role.id);
  }

  if (!base) {
    if (editionRoles.length < playerCount) return [];
    return shuffled(editionRoles, random)
      .slice(0, playerCount)
      .map((role) => role.id);
  }

  const groups = editionRoles.reduce<Record<ResidentTeam, Role[]>>(
    (result, role) => {
      if (role.team !== "traveller") result[role.team].push(role);
      return result;
    },
    { townsfolk: [], outsider: [], minion: [], demon: [] },
  );
  const demonOptions = shuffled(groups.demon, random);
  const minionOptions = shuffled(
    combinations(groups.minion, base.minion),
    random,
  );

  for (const demon of demonOptions) {
    for (const minions of minionOptions) {
      const selectedIds = [demon.id, ...minions.map((role) => role.id)];
      const possibleDeltas = shuffled(getOutsiderDeltas(selectedIds), random);

      for (const candidate of possibleDeltas) {
        const outsiderCount = base.outsider + candidate;
        const townsfolkCount = base.townsfolk - candidate;
        if (outsiderCount < 0 || townsfolkCount < 0) continue;
        if (
          groups.outsider.length < outsiderCount ||
          groups.townsfolk.length < townsfolkCount
        ) {
          continue;
        }

        const outsiders = shuffled(groups.outsider, random).slice(
          0,
          outsiderCount,
        );
        const townsfolk = shuffled(groups.townsfolk, random).slice(
          0,
          townsfolkCount,
        );
        const selected = [demon, ...minions, ...outsiders, ...townsfolk];
        if (selected.length === playerCount) {
          return shuffled(selected, random).map((role) => role.id);
        }
      }
    }
  }

  return shuffled(editionRoles, random)
    .slice(0, playerCount)
    .map((role) => role.id);
}

export function canCreateRandomSetup(
  edition: EditionId,
  playerCount: number,
  allowedRoleIds: readonly string[],
) {
  return (
    createRandomSetup(edition, playerCount, () => 0.5, allowedRoleIds)
      .length === playerCount
  );
}
