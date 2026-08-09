"use client";

import { AlertCircle, AlertTriangle, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { DemonBluffRack } from "@/components/grimoire/demon-bluff-rack";
import { GrimoireBoard } from "@/components/grimoire/grimoire-board";
import {
  GrimoireSideSheet,
  type GrimoirePanel,
} from "@/components/grimoire/grimoire-side-sheet";
import { GrimoireToolbar } from "@/components/grimoire/grimoire-toolbar";
import { ReminderToken } from "@/components/grimoire/reminder-token";
import { RolePicker } from "@/components/grimoire/role-picker";
import { StorytellerDock } from "@/components/grimoire/storyteller-dock";
import { Button } from "@/components/ui/button";
import { usePersistedGrimoireSheetPin } from "@/hooks/use-persisted-grimoire-sheet-pin";
import { usePersistedNightOrderState } from "@/hooks/use-persisted-night-order-state";
import { useStorytellerGame } from "@/hooks/use-storyteller-game";
import {
  createRandomSetup,
  getDefaultAlignment,
  getSetupReminderWarnings,
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
import { createSetupRoleMetadata, DRUNK_ROLE_ID } from "@/lib/setup-effects";
import { cn } from "@/lib/utils";

type PickerTarget =
  | { type: "seat"; seatId: string }
  | { type: "bluff"; slot: number }
  | null;

export function StorytellerApp({ gameId }: { gameId: string }) {
  const { snapshot, loading, error, saveState, commit, refresh } =
    useStorytellerGame(gameId);
  const [openPanel, setOpenPanel] = useState<GrimoirePanel>(null);
  const [sheetPinned, setSheetPinned] = usePersistedGrimoireSheetPin(gameId);
  const [nightOrderState, setNightOrderState] =
    usePersistedNightOrderState(gameId);
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

  const setupReminderWarnings = getSetupReminderWarnings(
    snapshot.seats,
    snapshot.gameTokens,
  );

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
            gameId,
            seatId: null,
            tokenType: "custom",
            roleId: DRUNK_ROLE_ID,
            label: "Drunk Selected",
            position: gameTokens.length,
            metadata: createSetupRoleMetadata(),
          },
        ];
      }

      return {
        seats,
        gameTokens,
      };
    });
    setSelectedSeatId(null);
    setOpenPanel(null);
    setPendingReminder(null);
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
        (token) => token.tokenType === "bluff" || isPlayerPositionToken(token),
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

  function removeReminder(tokenId: string) {
    commit((current) => ({
      gameTokens: current.gameTokens.filter((token) => token.id !== tokenId),
    }));
    setSelectedReminderId((current) => (current === tokenId ? null : current));
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
    <main
      className={cn(
        "storyteller-shell",
        openPanel !== null && sheetPinned && "is-sheet-pinned",
      )}
    >
      <GrimoireToolbar
        editionId={snapshot.game.edition}
        joinCode={snapshot.game.joinCode}
        saveState={saveState}
      />

      <div className="grimoire-workspace">
        <GrimoireBoard
          editionId={snapshot.game.edition}
          seats={snapshot.seats}
          gameTokens={snapshot.gameTokens}
          selectedSeatId={selectedSeatId}
          selectedReminderId={selectedReminderId}
          placingReminder={pendingReminder !== null}
          onSelectSeat={(seatId) => {
            if (!sheetPinned) setOpenPanel(null);
            setSelectedReminderId(null);
            setSelectedSeatId(seatId);
          }}
          onSelectReminder={(tokenId) => {
            if (!sheetPinned) setOpenPanel(null);
            setSelectedSeatId(null);
            setPendingReminder(null);
            setSelectedReminderId(tokenId);
          }}
          onRemoveReminder={removeReminder}
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
          onClearBluff={(slot) => chooseBluff(slot, null)}
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
          removeReminder(selectedReminder.id);
        }}
        onCloseSelectedReminder={() => setSelectedReminderId(null)}
        onCancelReminderPlacement={() => setPendingReminder(null)}
      />

      <GrimoireSideSheet
        panel={openPanel}
        editionId={snapshot.game.edition}
        seats={snapshot.seats}
        gameTokens={snapshot.gameTokens}
        pinned={sheetPinned}
        childDialogOpen={pickerTarget !== null}
        pendingReminder={pendingReminder}
        nightOrderState={nightOrderState}
        onNightOrderStateChange={setNightOrderState}
        onPinnedChange={setSheetPinned}
        onClose={() => setOpenPanel(null)}
        onSelectSeat={(seatId) => {
          if (!sheetPinned) setOpenPanel(null);
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
        onPlaceNightReminder={(role, action) => {
          setPendingReminder(getReminderDefinition(role, action.label));
        }}
        onCancelReminderPlacement={() => setPendingReminder(null)}
      />
      <RolePicker
        open={pickerTarget !== null}
        editionId={snapshot.game.edition}
        title={
          pickerTarget?.type === "bluff"
            ? "Choose a Demon Bluff"
            : pickerTarget?.type === "seat"
              ? `Choose a Character for ${snapshot.seats.find((seat) => seat.id === pickerTarget.seatId)?.playerName ?? "Player"}`
              : "Choose a Character"
        }
        clearLabel={
          pickerTarget?.type === "bluff" ? "Clear Bluff" : "Clear Assignment"
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

      {setupReminderWarnings.length > 0 && (
        <aside className="board-setup-warning" role="status" aria-live="polite">
          <header className="board-setup-warning-header">
            <AlertTriangle aria-hidden="true" />
            <span className="utility-label">Missing Reminders</span>
          </header>
          <div className="board-setup-warning-tokens">
            {setupReminderWarnings.flatMap((warning) =>
              warning.missing.map(({ label, count }) => (
                <span
                  key={`${warning.roleId}:${label}`}
                  className="board-setup-warning-token"
                  title={`${warning.roleName}: ${label}`}
                >
                  <ReminderToken
                    label={label}
                    roleId={warning.roleId}
                    size="tray"
                    count={count}
                  />
                  <span>{label}</span>
                </span>
              )),
            )}
          </div>
        </aside>
      )}

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
        <h1 className="font-display text-3xl">Unable to Open This Grimoire</h1>
        <p>{message}</p>
        <div className="grimoire-error-actions">
          <Button variant="secondary" onClick={onRetry}>
            <RotateCcw className="size-4" />
            Try Again
          </Button>
          <Button
            className="text-white/60 hover:bg-white/8 hover:text-white"
            variant="quiet"
            onClick={() => window.location.assign("/")}
          >
            Back Home
          </Button>
        </div>
      </div>
    </main>
  );
}
