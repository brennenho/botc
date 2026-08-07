"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { DemonBluffRack } from "@/components/grimoire/demon-bluff-rack";
import { GrimoireBoard } from "@/components/grimoire/grimoire-board";
import {
  GrimoireSideSheet,
  type GrimoirePanel,
} from "@/components/grimoire/grimoire-side-sheet";
import { GrimoireToolbar } from "@/components/grimoire/grimoire-toolbar";
import { RolePicker } from "@/components/grimoire/role-picker";
import { StorytellerDock } from "@/components/grimoire/storyteller-dock";
import { Button } from "@/components/ui/button";
import { useStorytellerGame } from "@/hooks/use-storyteller-game";
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
  getReminderDefinition,
  updateReminderPlacement,
  withReminderKey,
  type ReminderDefinition,
} from "@/lib/reminders";

type PickerTarget =
  | { type: "seat"; seatId: string }
  | { type: "bluff"; slot: number }
  | null;

export function StorytellerApp({ gameId }: { gameId: string }) {
  const { snapshot, loading, error, saveState, commit, refresh } =
    useStorytellerGame(gameId);
  const [openPanel, setOpenPanel] = useState<GrimoirePanel>(null);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [selectedReminderId, setSelectedReminderId] = useState<string | null>(
    null,
  );
  const [pendingReminder, setPendingReminder] =
    useState<ReminderDefinition | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const bluffs = useMemo(
    () =>
      snapshot?.gameTokens
        .filter((token) => token.tokenType === "bluff")
        .sort((a, b) => a.position - b.position) ?? [],
    [snapshot?.gameTokens],
  );
  const selectedReminder = useMemo(
    () =>
      snapshot?.gameTokens.find(
        (token) =>
          token.tokenType === "reminder" && token.id === selectedReminderId,
      ) ?? null,
    [selectedReminderId, snapshot?.gameTokens],
  );

  if (loading) return <GrimoireLoading />;
  if (!snapshot)
    return <GrimoireError message={error} onRetry={() => void refresh()} />;

  function makeSeat(index: number): Seat {
    return {
      id: crypto.randomUUID(),
      gameId,
      seatIndex: index,
      playerName: `Player ${index + 1}`,
      roleId: null,
      alignment: "good",
      alive: true,
      ghostVoteAvailable: true,
      isTraveller: false,
      joinedAt: new Date().toISOString(),
    };
  }

  function updateSeat(seatId: string, patch: Partial<Seat>) {
    commit((current) => ({
      seats: current.seats.map((seat) =>
        seat.id === seatId ? { ...seat, ...patch } : seat,
      ),
    }));
  }

  function chooseRole(seatId: string, roleId: string | null) {
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
      gameTokens: current.gameTokens.filter(
        (token) =>
          token.seatId !== seatId ||
          token.roleId === null ||
          token.roleId === roleId,
      ),
    }));
    setPickerTarget(null);
  }

  function chooseBluff(slot: number, roleId: string | null) {
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
        gameId,
        seatId: null,
        tokenType: "bluff",
        roleId: role.id,
        label: role.name,
        position: slot,
        metadata: {},
      };
      return { gameTokens: [...remaining, bluff] };
    });
    setPickerTarget(null);
  }

  function addPlayer() {
    commit((current) => {
      const seat = makeSeat(current.seats.length);
      return { seats: [...current.seats, seat] };
    });
  }

  function removePlayer(seatId: string) {
    commit((current) => ({
      seats: current.seats
        .filter((seat) => seat.id !== seatId)
        .map((seat, seatIndex) => ({ ...seat, seatIndex })),
      gameTokens: current.gameTokens.filter((token) => token.seatId !== seatId),
    }));
    setSelectedSeatId(null);
  }

  function distributeRoles(rolePoolIds: string[]) {
    commit((current) => {
      const residentSeats = current.seats.filter((seat) => !seat.isTraveller);
      const roleIds = createRandomSetup(
        current.game.edition,
        residentSeats.length,
        Math.random,
        rolePoolIds,
      );
      if (roleIds.length !== residentSeats.length) return {};
      let residentIndex = 0;
      return {
        seats: current.seats.map((seat) => {
          if (seat.isTraveller) return seat;
          const roleId = roleIds[residentIndex++] ?? null;
          const role = roleId ? roleById.get(roleId) : null;
          return {
            ...seat,
            roleId: role?.id ?? null,
            alignment: role ? getDefaultAlignment(role) : "good",
          };
        }),
        gameTokens: current.gameTokens.filter(isPlayerPositionToken),
      };
    });
    setSelectedSeatId(null);
  }

  function clearAssignments() {
    commit((current) => ({
      seats: current.seats.map((seat) => ({
        ...seat,
        roleId: null,
        alignment: "good",
        isTraveller: false,
      })),
      gameTokens: current.gameTokens.filter(
        (token) => token.seatId === null || token.roleId === null,
      ),
    }));
    setSelectedSeatId(null);
  }

  function addReminder(seatId: string, definition: ReminderDefinition) {
    commit((current) => {
      const order = getAnchoredReminders(current.gameTokens, seatId).length;
      const reminder: GameToken = {
        id: crypto.randomUUID(),
        gameId,
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
  }

  function movePlayer(seatId: string, position: CanvasPosition) {
    commit((current) => {
      const existing = current.gameTokens.find(
        (token) => isPlayerPositionToken(token) && token.seatId === seatId,
      );
      const positionToken: GameToken = {
        id: existing?.id ?? crypto.randomUUID(),
        gameId,
        seatId,
        tokenType: "custom",
        roleId: null,
        label: "Player position",
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
  }

  function moveReminder(
    tokenId: string,
    placement: ReminderPlacement,
    seatId?: string,
  ) {
    commit((current) => ({
      gameTokens: updateReminderPlacement(
        current.gameTokens,
        tokenId,
        placement,
        seatId,
      ),
    }));
  }

  function arrangeInCircle() {
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
  }

  return (
    <main className="storyteller-shell">
      <GrimoireToolbar
        editionId={snapshot.game.edition}
        joinCode={snapshot.game.joinCode}
        saveState={saveState}
      />

      <div className="grimoire-workspace">
        <GrimoireBoard
          seats={snapshot.seats}
          gameTokens={snapshot.gameTokens}
          selectedSeatId={selectedSeatId}
          selectedReminderId={selectedReminderId}
          placingReminder={pendingReminder !== null}
          onSelectSeat={(seatId) => {
            setOpenPanel(null);
            setSelectedReminderId(null);
            setSelectedSeatId(seatId);
          }}
          onSelectReminder={(tokenId) => {
            setOpenPanel(null);
            setSelectedSeatId(null);
            setPendingReminder(null);
            setSelectedReminderId(tokenId);
          }}
          onPlaceReminder={(seatId) => {
            if (!pendingReminder) return;
            addReminder(seatId, pendingReminder);
            setPendingReminder(null);
          }}
          onClearSelection={() => {
            setSelectedSeatId(null);
            setSelectedReminderId(null);
            setPendingReminder(null);
          }}
          onRenameSeat={(seatId, playerName) =>
            updateSeat(seatId, { playerName })
          }
          onChooseRole={(seatId) => setPickerTarget({ type: "seat", seatId })}
          onSetAlive={(seatId, alive) => {
            const seat = snapshot.seats.find(
              (candidate) => candidate.id === seatId,
            );
            updateSeat(seatId, {
              alive,
              ghostVoteAvailable: alive
                ? true
                : (seat?.ghostVoteAvailable ?? true),
            });
          }}
          onSetAlignment={(seatId, alignment) =>
            updateSeat(seatId, { alignment })
          }
          onSetGhostVote={(seatId, ghostVoteAvailable) =>
            updateSeat(seatId, { ghostVoteAvailable })
          }
          onSetTraveller={(seatId, isTraveller) =>
            updateSeat(seatId, { isTraveller })
          }
          onAddReminder={addReminder}
          onRemovePlayer={removePlayer}
          onMovePlayer={movePlayer}
          onMoveReminder={moveReminder}
        />
        <DemonBluffRack
          bluffs={bluffs}
          onChooseBluff={(slot) => setPickerTarget({ type: "bluff", slot })}
        />
      </div>

      <StorytellerDock
        selectedReminder={openPanel === null ? selectedReminder : null}
        reminderOwner={
          selectedReminder?.seatId
            ? (snapshot.seats.find(
                (seat) => seat.id === selectedReminder.seatId,
              ) ?? null)
            : null
        }
        pendingReminder={pendingReminder}
        playersOpen={openPanel === "players"}
        nightOpen={openPanel === "night"}
        onOpenPlayers={() => {
          setSelectedSeatId(null);
          setSelectedReminderId(null);
          setPendingReminder(null);
          setOpenPanel((current) => (current === "players" ? null : "players"));
        }}
        onOpenNight={() => {
          setSelectedSeatId(null);
          setSelectedReminderId(null);
          setPendingReminder(null);
          setOpenPanel((current) => (current === "night" ? null : "night"));
        }}
        onRemoveSelectedReminder={() => {
          if (!selectedReminder) return;
          commit((current) => ({
            gameTokens: current.gameTokens.filter(
              (token) => token.id !== selectedReminder.id,
            ),
          }));
          setSelectedReminderId(null);
        }}
        onCloseSelectedReminder={() => setSelectedReminderId(null)}
        onCancelReminderPlacement={() => setPendingReminder(null)}
      />

      <GrimoireSideSheet
        panel={openPanel}
        gameId={gameId}
        editionId={snapshot.game.edition}
        seats={snapshot.seats}
        onClose={() => setOpenPanel(null)}
        onSelectSeat={(seatId) => {
          setOpenPanel(null);
          setSelectedReminderId(null);
          setSelectedSeatId(seatId);
        }}
        onChooseRole={(seatId) => setPickerTarget({ type: "seat", seatId })}
        onClearRole={(seatId) => chooseRole(seatId, null)}
        onRemovePlayer={removePlayer}
        onRename={(seatId, playerName) => updateSeat(seatId, { playerName })}
        onAddPlayer={addPlayer}
        onDistributeRoles={distributeRoles}
        onClearAssignments={clearAssignments}
        onArrangeCircle={arrangeInCircle}
        gameTokens={snapshot.gameTokens}
        onPlaceNightReminder={(role, action) => {
          setPendingReminder(getReminderDefinition(role, action.label));
        }}
      />
      <RolePicker
        open={pickerTarget !== null}
        editionId={snapshot.game.edition}
        title={
          pickerTarget?.type === "bluff"
            ? "Choose a demon bluff"
            : pickerTarget?.type === "seat"
              ? `Choose a character for ${snapshot.seats.find((seat) => seat.id === pickerTarget.seatId)?.playerName ?? "player"}`
              : "Choose a character"
        }
        clearLabel={
          pickerTarget?.type === "bluff" ? "Clear bluff" : "Clear assignment"
        }
        selectedRoleId={
          pickerTarget?.type === "seat"
            ? (snapshot.seats.find((seat) => seat.id === pickerTarget.seatId)
                ?.roleId ?? null)
            : pickerTarget?.type === "bluff"
              ? (bluffs.find((token) => token.position === pickerTarget.slot)
                  ?.roleId ?? null)
              : null
        }
        usedRoleIds={snapshot.seats.flatMap((seat) =>
          seat.roleId ? [seat.roleId] : [],
        )}
        bluffRoleIds={bluffs.flatMap((bluff) =>
          bluff.roleId ? [bluff.roleId] : [],
        )}
        onOpenChange={(open) => !open && setPickerTarget(null)}
        onSelect={(roleId) => {
          if (pickerTarget?.type === "seat")
            chooseRole(pickerTarget.seatId, roleId);
          if (pickerTarget?.type === "bluff")
            chooseBluff(pickerTarget.slot, roleId);
        }}
      />

      {error && (
        <div className="save-error" role="alert">
          <AlertCircle className="size-4" />
          <span>{error}</span>
          <Button
            type="button"
            size="sm"
            variant="quiet"
            className="save-error-action"
            onClick={() => void refresh()}
          >
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
        </div>
      )}
      <div className="portrait-notice">
        <RotateCcw className="size-5" />
        <p>Rotate to landscape for the grimoire.</p>
      </div>
    </main>
  );
}

function GrimoireLoading() {
  return (
    <main className="grimoire-error-screen">
      <div className="size-6 animate-spin rounded-full border-2 border-white/15 border-t-[var(--brass)]" />
    </main>
  );
}

function GrimoireError({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <main className="grimoire-error-screen">
      <div>
        <AlertCircle className="mx-auto mb-4 size-7 text-red-300/80" />
        <h1 className="font-display text-3xl">Unable to open this grimoire</h1>
        <p>{message}</p>
        <div className="grimoire-error-actions">
          <Button variant="secondary" onClick={onRetry}>
            <RotateCcw className="size-4" />
            Try again
          </Button>
          <Button
            className="text-white/60 hover:bg-white/8 hover:text-white"
            variant="quiet"
            onClick={() => window.location.assign("/")}
          >
            Back home
          </Button>
        </div>
      </div>
    </main>
  );
}
