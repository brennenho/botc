"use client";

import { useCallback } from "react";

import type { StorytellerCommit } from "@/hooks/use-storyteller-game";
import {
  appendPlayer,
  appendReminder,
  assignSeatRole,
  clearRoleAssignments,
  dealRoles,
  deletePlayer,
  deleteReminder,
  patchSeat,
  resetTokenPositions,
  setDemonBluff,
  setPlayerPosition,
  setReminderPlacement,
  type MutableSeatPatch,
} from "@/lib/game-state";
import type { CanvasPosition, ReminderPlacement } from "@/lib/grimoire-canvas";
import { trackEvent } from "@/lib/observability/client";
import type { ReminderDefinition } from "@/lib/reminders";

type UseGrimoireActionsOptions = {
  commit: StorytellerCommit;
};

export function useGrimoireActions({ commit }: UseGrimoireActionsOptions) {
  const updateSeat = useCallback(
    (seatId: string, patch: MutableSeatPatch) => {
      commit((current) => patchSeat(current, seatId, patch));
    },
    [commit],
  );

  const chooseRole = useCallback(
    (seatId: string, roleId: string | null) => {
      commit((current) => assignSeatRole(current, seatId, roleId));
      trackEvent("role_assigned", {
        actor_role: "storyteller",
        assigned: roleId !== null,
      });
    },
    [commit],
  );

  const chooseBluff = useCallback(
    (slot: number, roleId: string | null) => {
      commit((current) => setDemonBluff(current, slot, roleId));
      trackEvent("demon_bluff_assigned", {
        actor_role: "storyteller",
        slot,
        assigned: roleId !== null,
      });
    },
    [commit],
  );

  const addPlayer = useCallback(() => {
    commit((current) => appendPlayer(current));
    trackEvent("player_added", { actor_role: "storyteller" });
  }, [commit]);

  const removePlayer = useCallback(
    (seatId: string) => {
      commit((current) => deletePlayer(current, seatId));
      trackEvent("player_removed", { actor_role: "storyteller" });
    },
    [commit],
  );

  const distributeRoles = useCallback(
    (rolePoolIds: string[]) => {
      commit((current) => dealRoles(current, rolePoolIds));
      trackEvent("roles_distributed", {
        actor_role: "storyteller",
        role_count: rolePoolIds.length,
      });
    },
    [commit],
  );

  const clearAssignments = useCallback(() => {
    commit((current) => clearRoleAssignments(current));
    trackEvent("role_assignments_cleared", {
      actor_role: "storyteller",
    });
  }, [commit]);

  const addReminder = useCallback(
    (seatId: string, definition: ReminderDefinition) => {
      commit((current) => appendReminder(current, seatId, definition));
      trackEvent("reminder_added", { actor_role: "storyteller" });
    },
    [commit],
  );

  const removeReminder = useCallback(
    (tokenId: string) => {
      commit((current) => deleteReminder(current, tokenId));
      trackEvent("reminder_removed", { actor_role: "storyteller" });
    },
    [commit],
  );

  const movePlayer = useCallback(
    (seatId: string, position: CanvasPosition) => {
      commit((current) => setPlayerPosition(current, seatId, position));
    },
    [commit],
  );

  const moveReminder = useCallback(
    (tokenId: string, placement: ReminderPlacement, seatId?: string) => {
      commit((current) =>
        setReminderPlacement(current, tokenId, placement, seatId),
      );
    },
    [commit],
  );

  const arrangeInCircle = useCallback(() => {
    commit((current) => resetTokenPositions(current));
  }, [commit]);

  return {
    updateSeat,
    chooseRole,
    chooseBluff,
    addPlayer,
    removePlayer,
    distributeRoles,
    clearAssignments,
    addReminder,
    removeReminder,
    movePlayer,
    moveReminder,
    arrangeInCircle,
  };
}
