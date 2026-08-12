"use client";

import { useCallback } from "react";

import type { StorytellerCommit } from "@/hooks/use-storyteller-game";
import {
  createRandomSetup,
  getDefaultAlignment,
  roleById,
} from "@/lib/game-data";
import type { GameToken, Seat } from "@/lib/game-data/types";
import {
  isPlayerPositionToken,
  PLAYER_POSITION_KIND,
  withReminderPlacement,
  type CanvasPosition,
  type ReminderPlacement,
} from "@/lib/grimoire-canvas";
import {
  getAnchoredReminders,
  updateReminderPlacement,
  withReminderKey,
  type ReminderDefinition,
} from "@/lib/reminders";
import { createSetupRoleMetadata, DRUNK_ROLE_ID } from "@/lib/setup-effects";

type UseGrimoireActionsOptions = {
  commit: StorytellerCommit;
};

function createSeat(seatIndex: number): Seat {
  return {
    id: crypto.randomUUID(),
    seatIndex,
    playerName: `Player ${seatIndex + 1}`,
    claimedByPlayer: false,
    roleId: null,
    alignment: "good",
    alive: true,
    ghostVoteAvailable: true,
    isTraveller: false,
    joinedAt: new Date().toISOString(),
  };
}

export function useGrimoireActions({ commit }: UseGrimoireActionsOptions) {
  const updateSeat = useCallback(
    (seatId: string, patch: Partial<Seat>) => {
      commit((current) => ({
        seats: current.seats.map((seat) =>
          seat.id === seatId ? { ...seat, ...patch } : seat,
        ),
      }));
    },
    [commit],
  );

  const chooseRole = useCallback(
    (seatId: string, roleId: string | null) => {
      const role = roleId ? roleById.get(roleId) : null;
      commit((current) => ({
        seats: current.seats.map((seat) =>
          seat.id === seatId
            ? {
                ...seat,
                roleId: role?.id ?? null,
                alignment: role ? getDefaultAlignment(role) : "good",
                isTraveller: role?.team === "traveller",
              }
            : seat,
        ),
      }));
    },
    [commit],
  );

  const chooseBluff = useCallback(
    (slot: number, roleId: string | null) => {
      const role = roleId ? roleById.get(roleId) : null;
      if (roleId && !role) return;

      commit((current) => {
        const existing = current.gameTokens.find(
          (token) => token.tokenType === "bluff" && token.position === slot,
        );
        const remaining = current.gameTokens.filter(
          (token) => token.id !== existing?.id,
        );
        if (!role) return { gameTokens: remaining };

        const bluff: GameToken = {
          id: existing?.id ?? crypto.randomUUID(),
          seatId: null,
          tokenType: "bluff",
          roleId: role.id,
          label: role.name,
          position: slot,
          metadata: {},
        };
        return { gameTokens: [...remaining, bluff] };
      });
    },
    [commit],
  );

  const addPlayer = useCallback(() => {
    commit((current) => ({
      seats: [...current.seats, createSeat(current.seats.length)],
    }));
  }, [commit]);

  const removePlayer = useCallback(
    (seatId: string) => {
      commit((current) => ({
        seats: current.seats
          .filter((seat) => seat.id !== seatId)
          .map((seat, seatIndex) => ({ ...seat, seatIndex })),
        gameTokens: current.gameTokens.filter(
          (token) => token.seatId !== seatId,
        ),
      }));
    },
    [commit],
  );

  const distributeRoles = useCallback(
    (rolePoolIds: string[]) => {
      const drunkSelected = rolePoolIds.includes(DRUNK_ROLE_ID);
      const dealtRoleIds = rolePoolIds.filter(
        (roleId) => roleId !== DRUNK_ROLE_ID,
      );

      commit((current) => {
        const residentSeats = current.seats.filter((seat) => !seat.isTraveller);
        const roleIds = createRandomSetup(
          current.game.edition,
          residentSeats.length,
          Math.random,
          dealtRoleIds,
        );
        if (roleIds.length !== residentSeats.length) return {};

        let residentIndex = 0;
        const seats = current.seats.map((seat) => {
          if (seat.isTraveller) return seat;
          const roleId = roleIds[residentIndex++] ?? null;
          const role = roleId ? roleById.get(roleId) : null;
          return {
            ...seat,
            roleId: role?.id ?? null,
            alignment: role ? getDefaultAlignment(role) : "good",
          };
        });
        let gameTokens = current.gameTokens.filter(isPlayerPositionToken);
        if (drunkSelected) {
          gameTokens = [
            ...gameTokens,
            {
              id: crypto.randomUUID(),
              seatId: null,
              tokenType: "custom",
              roleId: DRUNK_ROLE_ID,
              label: "Drunk Selected",
              position: gameTokens.length,
              metadata: createSetupRoleMetadata(),
            },
          ];
        }

        return { seats, gameTokens };
      });
    },
    [commit],
  );

  const clearAssignments = useCallback(() => {
    commit((current) => ({
      seats: current.seats.map((seat) => ({
        ...seat,
        roleId: null,
        alignment: "good",
        isTraveller: false,
      })),
      gameTokens: current.gameTokens.filter(
        (token) => token.tokenType === "bluff" || isPlayerPositionToken(token),
      ),
    }));
  }, [commit]);

  const addReminder = useCallback(
    (seatId: string, definition: ReminderDefinition) => {
      commit((current) => {
        const order = getAnchoredReminders(current.gameTokens, seatId).length;
        const reminder: GameToken = {
          id: crypto.randomUUID(),
          seatId,
          tokenType: "reminder",
          roleId: definition.roleId,
          label: definition.label,
          position: current.gameTokens.length,
          metadata: withReminderPlacement(withReminderKey({}, definition.key), {
            mode: "anchored",
            order,
          }),
        };
        return { gameTokens: [...current.gameTokens, reminder] };
      });
    },
    [commit],
  );

  const removeReminder = useCallback(
    (tokenId: string) => {
      commit((current) => ({
        gameTokens: current.gameTokens.filter((token) => token.id !== tokenId),
      }));
    },
    [commit],
  );

  const movePlayer = useCallback(
    (seatId: string, position: CanvasPosition) => {
      commit((current) => {
        const existing = current.gameTokens.find(
          (token) => isPlayerPositionToken(token) && token.seatId === seatId,
        );
        const positionToken: GameToken = {
          id: existing?.id ?? crypto.randomUUID(),
          seatId,
          tokenType: "custom",
          roleId: null,
          label: "Player Position",
          position: existing?.position ?? current.gameTokens.length,
          metadata: {
            kind: PLAYER_POSITION_KIND,
            canvasPosition: position,
          },
        };
        return {
          gameTokens: existing
            ? current.gameTokens.map((token) =>
                token.id === existing.id ? positionToken : token,
              )
            : [...current.gameTokens, positionToken],
        };
      });
    },
    [commit],
  );

  const moveReminder = useCallback(
    (tokenId: string, placement: ReminderPlacement, seatId?: string) => {
      commit((current) => ({
        gameTokens: updateReminderPlacement(
          current.gameTokens,
          tokenId,
          placement,
          seatId,
        ),
      }));
    },
    [commit],
  );

  const arrangeInCircle = useCallback(() => {
    commit((current) => {
      const reminderOrders = new Map<string, number>();
      return {
        gameTokens: current.gameTokens
          .filter((token) => !isPlayerPositionToken(token))
          .map((token) => {
            if (token.tokenType !== "reminder" || !token.seatId) return token;
            const order = reminderOrders.get(token.seatId) ?? 0;
            reminderOrders.set(token.seatId, order + 1);
            return {
              ...token,
              metadata: withReminderPlacement(token.metadata, {
                mode: "anchored",
                order,
              }),
            };
          }),
      };
    });
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
