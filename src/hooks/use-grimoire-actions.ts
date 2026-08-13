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
    },
    [commit],
  );

  const chooseBluff = useCallback(
    (slot: number, roleId: string | null) => {
      commit((current) => setDemonBluff(current, slot, roleId));
    },
    [commit],
  );

  const addPlayer = useCallback(() => {
    commit((current) => appendPlayer(current));
  }, [commit]);

  const removePlayer = useCallback(
    (seatId: string) => {
      commit((current) => deletePlayer(current, seatId));
    },
    [commit],
  );

  const distributeRoles = useCallback(
    (rolePoolIds: string[]) => {
      commit((current) => dealRoles(current, rolePoolIds));
    },
    [commit],
  );

  const clearAssignments = useCallback(() => {
    commit((current) => clearRoleAssignments(current));
  }, [commit]);

  const addReminder = useCallback(
    (seatId: string, definition: ReminderDefinition) => {
      commit((current) => appendReminder(current, seatId, definition));
    },
    [commit],
  );

  const removeReminder = useCallback(
    (tokenId: string) => {
      commit((current) => deleteReminder(current, tokenId));
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
