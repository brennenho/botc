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
  withoutCanvasPosition,
  type CanvasPosition,
} from "@/lib/grimoire-canvas";

type PickerTarget =
  | { type: "seat"; seatId: string }
  | { type: "bluff"; slot: number }
  | null;

export function StorytellerApp({ gameId }: { gameId: string }) {
  const { snapshot, loading, error, saveState, commit, refresh } =
    useStorytellerGame(gameId);
  const [openPanel, setOpenPanel] = useState<GrimoirePanel>(null);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const selectedSeat = useMemo(
    () => snapshot?.seats.find((seat) => seat.id === selectedSeatId) ?? null,
    [selectedSeatId, snapshot?.seats],
  );
  const selectedReminders = useMemo(
    () =>
      snapshot?.gameTokens.filter(
        (token) =>
          token.tokenType === "reminder" && token.seatId === selectedSeatId,
      ) ?? [],
    [selectedSeatId, snapshot?.gameTokens],
  );
  const bluffs = useMemo(
    () =>
      snapshot?.gameTokens
        .filter((token) => token.tokenType === "bluff")
        .sort((a, b) => a.position - b.position) ?? [],
    [snapshot?.gameTokens],
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

  function randomizeRoles(rolePoolIds: string[]) {
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

  function addReminder(seatId: string, label: string, roleId: string | null) {
    commit((current) => {
      const reminder: GameToken = {
        id: crypto.randomUUID(),
        gameId,
        seatId,
        tokenType: "reminder",
        roleId,
        label,
        position: current.gameTokens.length,
        metadata: {},
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

  function moveReminder(tokenId: string, position: CanvasPosition) {
    commit((current) => ({
      gameTokens: current.gameTokens.map((token) =>
        token.id === tokenId
          ? {
              ...token,
              metadata: { ...token.metadata, canvasPosition: position },
            }
          : token,
      ),
    }));
  }

  function arrangeInCircle() {
    commit((current) => ({
      gameTokens: current.gameTokens
        .filter((token) => !isPlayerPositionToken(token))
        .map((token) =>
          token.tokenType === "reminder"
            ? { ...token, metadata: withoutCanvasPosition(token.metadata) }
            : token,
        ),
    }));
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
          onSelectSeat={(seatId) => {
            setOpenPanel(null);
            setSelectedSeatId(seatId);
          }}
          onClearSelection={() => setSelectedSeatId(null)}
          onRenameSeat={(seatId, playerName) =>
            updateSeat(seatId, { playerName })
          }
          onMovePlayer={movePlayer}
          onMoveReminder={moveReminder}
        />
        <DemonBluffRack
          bluffs={bluffs}
          onChooseBluff={(slot) => setPickerTarget({ type: "bluff", slot })}
        />
      </div>

      <StorytellerDock
        seat={openPanel === null ? selectedSeat : null}
        reminders={selectedReminders}
        playersOpen={openPanel === "players"}
        nightOpen={openPanel === "night"}
        onCloseSeat={() => setSelectedSeatId(null)}
        onOpenPlayers={() => {
          setSelectedSeatId(null);
          setOpenPanel((current) => (current === "players" ? null : "players"));
        }}
        onOpenNight={() => {
          setSelectedSeatId(null);
          setOpenPanel((current) => (current === "night" ? null : "night"));
        }}
        onChooseRole={() =>
          selectedSeat &&
          setPickerTarget({ type: "seat", seatId: selectedSeat.id })
        }
        onSetAlive={(alive) =>
          selectedSeat &&
          updateSeat(selectedSeat.id, {
            alive,
            ghostVoteAvailable: alive ? true : selectedSeat.ghostVoteAvailable,
          })
        }
        onSetAlignment={(alignment) =>
          selectedSeat && updateSeat(selectedSeat.id, { alignment })
        }
        onSetGhostVote={(ghostVoteAvailable) =>
          selectedSeat && updateSeat(selectedSeat.id, { ghostVoteAvailable })
        }
        onAddReminder={(label, roleId) =>
          selectedSeat && addReminder(selectedSeat.id, label, roleId)
        }
        onRemoveReminder={(tokenId) =>
          commit((current) => ({
            gameTokens: current.gameTokens.filter(
              (token) => token.id !== tokenId,
            ),
          }))
        }
        onRemovePlayer={() => selectedSeat && removePlayer(selectedSeat.id)}
      />

      <GrimoireSideSheet
        panel={openPanel}
        gameId={gameId}
        editionId={snapshot.game.edition}
        seats={snapshot.seats}
        onClose={() => setOpenPanel(null)}
        onSelectSeat={setSelectedSeatId}
        onChooseRole={(seatId) => setPickerTarget({ type: "seat", seatId })}
        onRename={(seatId, playerName) => updateSeat(seatId, { playerName })}
        onAddPlayer={addPlayer}
        onRandomize={randomizeRoles}
        onArrangeCircle={arrangeInCircle}
      />
      <RolePicker
        open={pickerTarget !== null}
        editionId={snapshot.game.edition}
        title={
          pickerTarget?.type === "bluff"
            ? "Choose a demon bluff"
            : selectedSeat
              ? `Choose a character for ${selectedSeat.playerName}`
              : "Choose a character"
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
          <button type="button" onClick={() => void refresh()}>
            <RotateCcw className="size-3.5" />
            Retry
          </button>
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
