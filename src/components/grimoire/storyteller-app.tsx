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
import { PlayerRevealScreen } from "@/components/grimoire/player-reveal-screen";
import { ReminderToken } from "@/components/grimoire/reminder-token";
import { RolePicker } from "@/components/grimoire/role-picker";
import { StorytellerDock } from "@/components/grimoire/storyteller-dock";
import { Button } from "@/components/ui/button";
import { useGrimoireActions } from "@/hooks/use-grimoire-actions";
import { usePersistedGrimoireSheetPin } from "@/hooks/use-persisted-grimoire-sheet-pin";
import { usePersistedNightOrderState } from "@/hooks/use-persisted-night-order-state";
import { useStorytellerGame } from "@/hooks/use-storyteller-game";
import { getSetupReminderWarnings } from "@/lib/game-data";
import {
  getReminderDefinition,
  type ReminderDefinition,
} from "@/lib/reminders";
import { cn } from "@/lib/utils";
import type { NightRevealAction, PlayerReveal } from "@/lib/player-reveal";

type PickerTarget =
  | { type: "seat"; seatId: string }
  | { type: "bluff"; slot: number }
  | { type: "reveal"; heading: string }
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
  const [playerReveal, setPlayerReveal] = useState<PlayerReveal | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [redacted, setRedacted] = useState(false);
  const {
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
  } = useGrimoireActions({ gameId, commit });

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

  function handleRemovePlayer(seatId: string) {
    removePlayer(seatId);
    setSelectedSeatId(null);
  }

  function handleRemoveReminder(tokenId: string) {
    removeReminder(tokenId);
    setSelectedReminderId((current) => (current === tokenId ? null : current));
  }

  function handleDistributeRoles(roleIds: string[]) {
    distributeRoles(roleIds);
    setSelectedSeatId(null);
    setOpenPanel(null);
    setPendingReminder(null);
  }

  function handleClearAssignments() {
    clearAssignments();
    setSelectedSeatId(null);
  }

  function handleNightReveal(action: NightRevealAction) {
    if (action.kind === "choose-role") {
      setPickerTarget({ type: "reveal", heading: action.chooseRoleHeading });
      return;
    }
    setPlayerReveal(action.reveal);
  }

  function handleRedactedChange(nextRedacted: boolean) {
    setRedacted(nextRedacted);
    if (!nextRedacted) return;

    setOpenPanel(null);
    setSelectedSeatId(null);
    setSelectedReminderId(null);
    setPendingReminder(null);
    setPickerTarget(null);
    setPlayerReveal(null);
  }

  return (
    <main
      className={cn(
        "storyteller-shell",
        openPanel !== null && sheetPinned && !redacted && "is-sheet-pinned",
        redacted && "is-redacted",
      )}
    >
      <GrimoireToolbar
        editionId={snapshot.game.edition}
        joinCode={snapshot.game.joinCode}
        saveState={saveState}
        redacted={redacted}
        onRedactedChange={handleRedactedChange}
      />

      <div className="grimoire-workspace">
        <GrimoireBoard
          editionId={snapshot.game.edition}
          seats={snapshot.seats}
          gameTokens={snapshot.gameTokens}
          redacted={redacted}
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
          onRemoveReminder={handleRemoveReminder}
          onPlaceReminder={(seatId) => {
            if (!pendingReminder) return;
            addReminder(seatId, pendingReminder);
            setPendingReminder(null);
          }}
          onClearSelection={() => {
            if (!sheetPinned) setOpenPanel(null);
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
          onRemovePlayer={handleRemovePlayer}
          onMovePlayer={movePlayer}
          onMoveReminder={moveReminder}
        />
        {!redacted && (
          <DemonBluffRack
            bluffs={bluffs}
            onChooseBluff={(slot) => setPickerTarget({ type: "bluff", slot })}
            onClearBluff={(slot) => chooseBluff(slot, null)}
            onShowBluffs={() => setPlayerReveal({ type: "demon-bluffs" })}
          />
        )}
      </div>

      {!redacted && (
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
          infoOpen={openPanel === "info"}
          onOpenPlayers={() => {
            setSelectedSeatId(null);
            setSelectedReminderId(null);
            setPendingReminder(null);
            setOpenPanel((current) =>
              current === "players" ? null : "players",
            );
          }}
          onOpenNight={() => {
            setSelectedSeatId(null);
            setSelectedReminderId(null);
            setPendingReminder(null);
            setOpenPanel((current) => (current === "night" ? null : "night"));
          }}
          onOpenInfo={() => {
            setSelectedSeatId(null);
            setSelectedReminderId(null);
            setPendingReminder(null);
            setOpenPanel((current) => (current === "info" ? null : "info"));
          }}
          onRemoveSelectedReminder={() => {
            if (!selectedReminder) return;
            handleRemoveReminder(selectedReminder.id);
          }}
          onCloseSelectedReminder={() => setSelectedReminderId(null)}
          onCancelReminderPlacement={() => setPendingReminder(null)}
        />
      )}

      {!redacted && (
        <GrimoireSideSheet
          panel={openPanel}
          editionId={snapshot.game.edition}
          seats={snapshot.seats}
          gameTokens={snapshot.gameTokens}
          pinned={sheetPinned}
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
          onRemovePlayer={handleRemovePlayer}
          onRename={(seatId, playerName) => updateSeat(seatId, { playerName })}
          onAddPlayer={addPlayer}
          onDistributeRoles={handleDistributeRoles}
          onClearAssignments={handleClearAssignments}
          onArrangeCircle={arrangeInCircle}
          onPlaceNightReminder={(role, action) => {
            setPendingReminder(getReminderDefinition(role, action.label));
          }}
          onCancelReminderPlacement={() => setPendingReminder(null)}
          onNightReveal={handleNightReveal}
          onReveal={setPlayerReveal}
          onChooseRevealRole={(heading) =>
            setPickerTarget({ type: "reveal", heading })
          }
        />
      )}
      {!redacted && (
        <RolePicker
          open={pickerTarget !== null}
          editionId={snapshot.game.edition}
          title={
            pickerTarget?.type === "bluff"
              ? "Choose a Demon Bluff"
              : pickerTarget?.type === "reveal"
                ? `Choose a Character to Show with “${pickerTarget.heading}”`
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
            if (pickerTarget?.type === "reveal" && roleId) {
              setPlayerReveal({
                type: "role",
                heading: pickerTarget.heading,
                roleId,
              });
            }
            setPickerTarget(null);
          }}
        />
      )}

      {!redacted && (
        <PlayerRevealScreen
          reveal={playerReveal}
          seats={snapshot.seats}
          gameTokens={snapshot.gameTokens}
          onClose={() => setPlayerReveal(null)}
        />
      )}

      {!redacted && setupReminderWarnings.length > 0 && (
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
