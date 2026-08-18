"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import type { CharacterReferenceView } from "@/components/character-sheet/character-reference";
import { DemonBluffRack } from "@/components/storyteller/demon-bluff-rack";
import { GrimoireBoard } from "@/components/storyteller/grimoire-board";
import {
  GrimoireSideSheet,
  type GrimoirePanel,
} from "@/components/storyteller/grimoire-side-sheet";
import { GrimoireToolbar } from "@/components/grimoire/grimoire-toolbar";
import { PlayerRevealScreen } from "@/components/storyteller/player-reveal-screen";
import { ReminderToken } from "@/components/storyteller/reminder-token";
import { RolePicker } from "@/components/storyteller/role-picker";
import { StorytellerDock } from "@/components/storyteller/storyteller-dock";
import { PageError } from "@/components/ui/page-error";
import { StatusNotice } from "@/components/ui/status-notice";
import { useGamePresence } from "@/hooks/use-game-presence";
import { useGrimoireActions } from "@/hooks/use-grimoire-actions";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { usePersistedGrimoireSheetPin } from "@/hooks/use-persisted-grimoire-sheet-pin";
import { usePersistedNightOrderState } from "@/hooks/use-persisted-night-order-state";
import { useStorytellerGame } from "@/hooks/use-storyteller-game";
import { isTerminalGameError } from "@/lib/app-error";
import { getSetupReminderWarnings } from "@/lib/game-data";
import type { StorytellerSnapshot } from "@/lib/game-data/types";
import { getAdjacentSeatId } from "@/lib/keyboard-shortcuts";
import {
  getReminderDefinition,
  type ReminderDefinition,
} from "@/lib/reminders";
import { cn } from "@/lib/utils";
import {
  canShowPlayerReveal,
  type NightRevealAction,
  type PlayerReveal,
} from "@/lib/player-reveal";

type PickerTarget =
  | { type: "seat"; seatId: string }
  | { type: "bluff"; slot: number }
  | { type: "reveal"; heading: string }
  | null;

const residentTeams = ["townsfolk", "outsider", "minion", "demon"] as const;
const assignableTeams = [...residentTeams, "traveller"] as const;

export function StorytellerApp({
  gameCode,
  initialSnapshot,
}: {
  gameCode: string;
  initialSnapshot: StorytellerSnapshot;
}) {
  const {
    snapshot,
    refresh,
    refreshError,
    isRefreshing,
    saveState,
    saveError,
    commit,
    recoverSave,
    dismissSaveError,
  } = useStorytellerGame(gameCode, initialSnapshot);
  const presence = useGamePresence(gameCode);
  const [openPanel, setOpenPanel] = useState<GrimoirePanel>(null);
  const [referenceView, setReferenceView] =
    useState<CharacterReferenceView>("script");
  const [sheetPinned, setSheetPinned] = usePersistedGrimoireSheetPin(gameCode);
  const [nightOrderState, setNightOrderState] =
    usePersistedNightOrderState(gameCode);
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
  } = useGrimoireActions({ commit });

  const bluffs = useMemo(
    () =>
      snapshot.gameTokens
        .filter((token) => token.tokenType === "bluff")
        .sort((a, b) => a.position - b.position),
    [snapshot.gameTokens],
  );
  const selectedReminder = useMemo(
    () =>
      snapshot.gameTokens.find(
        (token) =>
          token.tokenType === "reminder" && token.id === selectedReminderId,
      ) ?? null,
    [selectedReminderId, snapshot.gameTokens],
  );

  useKeyboardShortcuts([
    {
      id: "toggle-players-panel",
      key: "p",
      enabled: !redacted,
      onTrigger: () => handleOpenPanel("players"),
    },
    {
      id: "toggle-night-panel",
      key: "n",
      enabled: !redacted,
      onTrigger: () => handleOpenPanel("night"),
    },
    {
      id: "toggle-info-panel",
      key: "i",
      enabled: !redacted,
      onTrigger: () => handleOpenPanel("info"),
    },
    {
      id: "toggle-script-panel",
      key: "r",
      enabled: !redacted,
      onTrigger: () => handleOpenPanel("script"),
    },
    {
      id: "close-character-picker",
      key: "c",
      enabled: pickerTarget?.type === "seat",
      allowInModal: true,
      onTrigger: () => setPickerTarget(null),
    },
    {
      id: "select-previous-player",
      key: "[",
      enabled: !redacted && snapshot.seats.length > 0,
      allowRepeat: true,
      onTrigger: () => handleSelectAdjacentSeat(-1),
    },
    {
      id: "select-next-player",
      key: "]",
      enabled: !redacted && snapshot.seats.length > 0,
      allowRepeat: true,
      onTrigger: () => handleSelectAdjacentSeat(1),
    },
    {
      id: "close-current-controls",
      key: "Escape",
      enabled: Boolean(
        pendingReminder !== null ||
        selectedReminderId !== null ||
        selectedSeatId !== null ||
        openPanel !== null,
      ),
      onTrigger: handleCloseShortcutLayer,
    },
  ]);

  if (isTerminalGameError(refreshError)) {
    return (
      <PageError
        title="Game unavailable"
        message="This game may have ended, or this link is no longer valid."
      />
    );
  }

  const setupReminderWarnings = getSetupReminderWarnings(
    snapshot.seats,
    snapshot.gameTokens,
  );

  function handleOpenPanel(panel: Exclude<GrimoirePanel, null>) {
    setSelectedSeatId(null);
    setSelectedReminderId(null);
    setPendingReminder(null);
    setOpenPanel((current) => (current === panel ? null : panel));
  }

  function handleSelectSeat(seatId: string) {
    if (!sheetPinned) setOpenPanel(null);
    setSelectedReminderId(null);
    setPendingReminder(null);
    setSelectedSeatId(seatId);
  }

  function handleSelectAdjacentSeat(direction: -1 | 1) {
    const seatId = getAdjacentSeatId(snapshot.seats, selectedSeatId, direction);
    if (seatId) handleSelectSeat(seatId);
  }

  function handleCloseShortcutLayer() {
    if (pendingReminder) {
      setPendingReminder(null);
      return;
    }
    if (selectedReminderId) {
      setSelectedReminderId(null);
      return;
    }
    if (selectedSeatId) {
      setSelectedSeatId(null);
      return;
    }
    if (openPanel) setOpenPanel(null);
  }

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
    handlePlayerReveal(action.reveal);
  }

  function handlePlayerReveal(reveal: PlayerReveal) {
    if (!canShowPlayerReveal(reveal, bluffs)) return;
    setPlayerReveal(reveal);
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
        actorRole="storyteller"
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
          shortcutsEnabled={!redacted}
          onlineSeatIds={presence.onlineSeatIds}
          presenceAvailable={presence.status === "connected"}
          onSelectSeat={handleSelectSeat}
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
          scriptOpen={openPanel === "script"}
          onOpenPlayers={() => handleOpenPanel("players")}
          onOpenNight={() => handleOpenPanel("night")}
          onOpenInfo={() => handleOpenPanel("info")}
          onOpenScript={() => handleOpenPanel("script")}
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
          shortcutsEnabled={
            selectedSeatId === null &&
            selectedReminderId === null &&
            pendingReminder === null
          }
          editionId={snapshot.game.edition}
          seats={snapshot.seats}
          gameTokens={snapshot.gameTokens}
          pinned={sheetPinned}
          pendingReminder={pendingReminder}
          referenceView={referenceView}
          nightOrderState={nightOrderState}
          onNightOrderStateChange={setNightOrderState}
          onPinnedChange={setSheetPinned}
          onReferenceViewChange={setReferenceView}
          onClose={() => setOpenPanel(null)}
          onSelectSeat={handleSelectSeat}
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
          onReveal={handlePlayerReveal}
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
          teams={
            pickerTarget?.type === "bluff" ? residentTeams : assignableTeams
          }
          collapsibleTeams={pickerTarget?.type === "bluff" ? [] : ["traveller"]}
          onOpenChange={(open) => !open && setPickerTarget(null)}
          onSelect={(roleId) => {
            if (pickerTarget?.type === "seat")
              chooseRole(pickerTarget.seatId, roleId);
            if (pickerTarget?.type === "bluff")
              chooseBluff(pickerTarget.slot, roleId);
            if (pickerTarget?.type === "reveal" && roleId) {
              handlePlayerReveal({
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

      {(saveError ?? refreshError) && (
        <div className="status-notice-stack">
          {saveError ? (
            <StatusNotice
              tone="danger"
              title="Changes weren’t saved"
              message={
                saveError.reconciled
                  ? "The latest saved game is shown."
                  : "The latest saved game couldn’t be restored."
              }
              actionLabel={saveError.reconciled ? undefined : "Reload latest"}
              actionPending={isRefreshing}
              onAction={
                saveError.reconciled ? undefined : () => void recoverSave()
              }
              onDismiss={saveError.reconciled ? dismissSaveError : undefined}
            />
          ) : refreshError ? (
            <StatusNotice
              tone="connection"
              title="Connection interrupted"
              message="Showing the latest available game."
              actionLabel="Retry"
              actionPending={isRefreshing}
              onAction={() => void refresh()}
            />
          ) : null}
        </div>
      )}
      <div className="portrait-notice">
        <RotateCcw className="size-5" />
        <p>Rotate to landscape for the grimoire.</p>
      </div>
    </main>
  );
}
