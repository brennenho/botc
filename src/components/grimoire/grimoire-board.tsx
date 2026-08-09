"use client";

import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { DraggableReminderToken } from "@/components/grimoire/draggable-reminder-token";
import { PlayerContextMenu } from "@/components/grimoire/player-context-menu";
import { PlayerToken } from "@/components/grimoire/player-token";
import type {
  Alignment,
  EditionId,
  GameToken,
  Seat,
} from "@/lib/game-data/types";
import {
  clampCanvasPosition,
  getPlayerPosition,
  getReminderPosition,
  readReminderPlacement,
  type CanvasPosition,
  type ReminderPlacement,
} from "@/lib/grimoire-canvas";
import {
  findReminderSnapTarget,
  getPlayerLabelSide,
  getReminderSlotPositions,
  type ReminderLabelSide,
} from "@/lib/reminder-layout";
import type { ReminderDefinition } from "@/lib/reminders";
import { getPlayerMenuPlacement } from "@/lib/player-menu-layout";

export function GrimoireBoard({
  editionId,
  seats,
  gameTokens,
  selectedSeatId,
  selectedReminderId,
  placingReminder,
  onSelectSeat,
  onSelectReminder,
  onRemoveReminder,
  onPlaceReminder,
  onClearSelection,
  onRenameSeat,
  onChooseRole,
  onSetAlive,
  onSetAlignment,
  onSetGhostVote,
  onSetTraveller,
  onAddReminder,
  onRemovePlayer,
  onMovePlayer,
  onMoveReminder,
}: {
  editionId: EditionId;
  seats: Seat[];
  gameTokens: GameToken[];
  selectedSeatId: string | null;
  selectedReminderId: string | null;
  placingReminder: boolean;
  onSelectSeat: (seatId: string) => void;
  onSelectReminder: (tokenId: string) => void;
  onRemoveReminder: (tokenId: string) => void;
  onPlaceReminder: (seatId: string) => void;
  onClearSelection: () => void;
  onRenameSeat: (seatId: string, playerName: string) => void;
  onChooseRole: (seatId: string) => void;
  onSetAlive: (seatId: string, alive: boolean) => void;
  onSetAlignment: (seatId: string, alignment: Alignment) => void;
  onSetGhostVote: (seatId: string, available: boolean) => void;
  onSetTraveller: (seatId: string, isTraveller: boolean) => void;
  onAddReminder: (seatId: string, definition: ReminderDefinition) => void;
  onRemovePlayer: (seatId: string) => void;
  onMovePlayer: (seatId: string, position: CanvasPosition) => void;
  onMoveReminder: (
    tokenId: string,
    placement: ReminderPlacement,
    seatId?: string,
  ) => void;
}) {
  const tokenSize = Math.round(
    Math.max(66, Math.min(112, 1440 / (seats.length + 5))),
  );
  const reminderSize = Math.max(60, Math.min(72, tokenSize * 0.64));
  const reminderClearance = Math.max(10, tokenSize * 0.1);
  const reminderGap = Math.max(6, reminderSize * 0.1);
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState({ width: 1000, height: 700 });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 160, tolerance: 8 },
    }),
  );

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const updateSize = () => {
      const rect = board.getBoundingClientRect();
      setBoardSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(board);
    return () => observer.disconnect();
  }, []);

  const playerPositions = new Map(
    seats.map((seat, index) => [
      seat.id,
      getPlayerPosition(gameTokens, seat.id, index, seats.length),
    ]),
  );
  const activeReminderId = activeId?.startsWith("reminder:")
    ? activeId.slice("reminder:".length)
    : null;
  const activePlayerSeatId = activeId?.startsWith("player:")
    ? activeId.slice("player:".length)
    : null;
  const displayPlayerPositions = new Map(playerPositions);

  if (activePlayerSeatId) {
    const playerPosition = playerPositions.get(activePlayerSeatId);
    if (playerPosition) {
      displayPlayerPositions.set(activePlayerSeatId, {
        x: playerPosition.x + (dragDelta.x / boardSize.width) * 100,
        y: playerPosition.y + (dragDelta.y / boardSize.height) * 100,
      });
    }
  }

  const selectedSeat = seats.find((seat) => seat.id === selectedSeatId) ?? null;
  const playerLabelSides = new Map(
    seats.flatMap((seat): [string, ReminderLabelSide][] => {
      const playerPosition = displayPlayerPositions.get(seat.id);
      return playerPosition
        ? [
            [
              seat.id,
              getPlayerLabelSide({
                playerPosition,
              }),
            ],
          ]
        : [];
    }),
  );
  const reminders = gameTokens.filter(
    (token) => token.tokenType === "reminder",
  );
  const anchoredRemindersBySeat = new Map<string, GameToken[]>();
  for (const reminder of reminders) {
    if (!reminder.seatId || readReminderPlacement(reminder).mode !== "anchored")
      continue;
    const existing = anchoredRemindersBySeat.get(reminder.seatId) ?? [];
    existing.push(reminder);
    anchoredRemindersBySeat.set(reminder.seatId, existing);
  }
  for (const seatReminders of anchoredRemindersBySeat.values()) {
    seatReminders.sort((a, b) => {
      const aPlacement = readReminderPlacement(a);
      const bPlacement = readReminderPlacement(b);
      const aOrder = aPlacement.mode === "anchored" ? aPlacement.order : 0;
      const bOrder = bPlacement.mode === "anchored" ? bPlacement.order : 0;
      return aOrder - bOrder || a.position - b.position;
    });
  }
  const reminderPositions = new Map<string, CanvasPosition>();

  for (const reminder of reminders) {
    const manualPosition = getReminderPosition(reminder);
    if (manualPosition) {
      reminderPositions.set(reminder.id, manualPosition);
      continue;
    }

    const seat = seats.find((candidate) => candidate.id === reminder.seatId);
    const playerPosition = seat ? playerPositions.get(seat.id) : null;
    if (!seat || !playerPosition) continue;
    const seatReminders = anchoredRemindersBySeat.get(seat.id) ?? [];
    const reminderIndex = seatReminders.findIndex(
      (token) => token.id === reminder.id,
    );
    const slots = getReminderSlotPositions({
      playerPosition,
      count: seatReminders.length,
      boardSize,
      playerSize: tokenSize,
      reminderSize,
      clearance: reminderClearance,
      gap: reminderGap,
    });
    const position = slots[reminderIndex];
    if (position) reminderPositions.set(reminder.id, position);
  }

  function getSnapTarget(position: CanvasPosition, tokenId: string) {
    return findReminderSnapTarget({
      dropPosition: position,
      players: seats.flatMap((seat) => {
        const playerPosition = playerPositions.get(seat.id);
        if (!playerPosition) return [];
        const anchoredReminderCount = (
          anchoredRemindersBySeat.get(seat.id) ?? []
        ).filter((reminder) => reminder.id !== tokenId).length;
        return [
          { seatId: seat.id, position: playerPosition, anchoredReminderCount },
        ];
      }),
      boardSize,
      playerSize: tokenSize,
      reminderSize,
      clearance: reminderClearance,
      gap: reminderGap,
    });
  }

  const activeReminderPosition = activeReminderId
    ? reminderPositions.get(activeReminderId)
    : null;
  const activeReminderDropPosition = activeReminderPosition
    ? clampCanvasPosition(
        {
          x: activeReminderPosition.x + (dragDelta.x / boardSize.width) * 100,
          y: activeReminderPosition.y + (dragDelta.y / boardSize.height) * 100,
        },
        ((reminderSize / 2 + 8) / boardSize.width) * 100,
        ((reminderSize / 2 + 8) / boardSize.height) * 100,
      )
    : null;
  const snapPreview =
    activeReminderId && activeReminderDropPosition
      ? getSnapTarget(activeReminderDropPosition, activeReminderId)
      : null;
  const displayReminderPositions = new Map(reminderPositions);
  const reflowingReminderIds = new Set<string>();
  const selectedPlayerPosition = selectedSeat
    ? playerPositions.get(selectedSeat.id)
    : null;
  const playerMenu =
    selectedSeat && selectedPlayerPosition
      ? getPlayerMenuPlacement({
          playerPosition: selectedPlayerPosition,
          boardSize,
          tokenSize,
        })
      : null;

  if (activePlayerSeatId) {
    const playerPosition = displayPlayerPositions.get(activePlayerSeatId);
    const seatReminders = anchoredRemindersBySeat.get(activePlayerSeatId) ?? [];

    if (playerPosition && seatReminders.length > 0) {
      const liveSlots = getReminderSlotPositions({
        playerPosition,
        count: seatReminders.length,
        boardSize,
        playerSize: tokenSize,
        reminderSize,
        clearance: reminderClearance,
        gap: reminderGap,
      });

      seatReminders.forEach((reminder, index) => {
        const position = liveSlots[index];
        if (position) displayReminderPositions.set(reminder.id, position);
      });
    }
  }

  if (activeReminderId && snapPreview) {
    const activeReminder = reminders.find(
      (reminder) => reminder.id === activeReminderId,
    );
    const sourceSeatId =
      activeReminder &&
      readReminderPlacement(activeReminder).mode === "anchored"
        ? activeReminder.seatId
        : null;
    const previewSeatIds = new Set(
      [sourceSeatId, snapPreview.seatId].filter((seatId): seatId is string =>
        Boolean(seatId),
      ),
    );

    for (const seatId of previewSeatIds) {
      const playerPosition = playerPositions.get(seatId);
      if (!playerPosition) continue;

      const previewOrder = (anchoredRemindersBySeat.get(seatId) ?? [])
        .filter((reminder) => reminder.id !== activeReminderId)
        .map((reminder) => reminder.id);
      if (seatId === snapPreview.seatId) {
        previewOrder.splice(snapPreview.order, 0, "snap-preview");
      }

      const previewSlots = getReminderSlotPositions({
        playerPosition,
        count: previewOrder.length,
        boardSize,
        playerSize: tokenSize,
        reminderSize,
        clearance: reminderClearance,
        gap: reminderGap,
      });

      previewOrder.forEach((reminderId, index) => {
        if (reminderId === "snap-preview") return;
        const position = previewSlots[index];
        if (!position) return;
        displayReminderPositions.set(reminderId, position);
        reflowingReminderIds.add(reminderId);
      });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const id = String(event.active.id);
    const [kind, tokenId] = id.split(":");
    const current =
      kind === "player"
        ? playerPositions.get(tokenId ?? "")
        : reminderPositions.get(tokenId ?? "");
    setActiveId(null);
    setDragDelta({ x: 0, y: 0 });
    if (!current || !tokenId) return;

    const size = kind === "player" ? tokenSize : reminderSize;
    const verticalClearance =
      kind === "player" ? tokenSize / 2 + 48 : size / 2 + 8;
    const position = clampCanvasPosition(
      {
        x: current.x + (event.delta.x / boardSize.width) * 100,
        y: current.y + (event.delta.y / boardSize.height) * 100,
      },
      ((size / 2 + 8) / boardSize.width) * 100,
      (verticalClearance / boardSize.height) * 100,
    );

    if (kind === "player") onMovePlayer(tokenId, position);
    if (kind === "reminder") {
      const snapTarget = getSnapTarget(position, tokenId);
      if (snapTarget) {
        onMoveReminder(
          tokenId,
          { mode: "anchored", order: snapTarget.order },
          snapTarget.seatId,
        );
      } else {
        onMoveReminder(tokenId, { mode: "free", canvasPosition: position });
      }
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    setActiveId(id);
    setDragDelta({ x: 0, y: 0 });
    if (id.startsWith("player:")) onClearSelection();
  }

  function handleDragMove(event: DragMoveEvent) {
    setDragDelta(event.delta);
  }

  function handleDragCancel(_event: DragCancelEvent) {
    setActiveId(null);
    setDragDelta({ x: 0, y: 0 });
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grimoire-frame">
        <div
          ref={boardRef}
          className="grimoire-board"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClearSelection();
          }}
        >
          {seats.map((seat) => {
            const position = playerPositions.get(seat.id);
            if (!position) return null;

            return (
              <div
                key={seat.id}
                className={`canvas-player-position ${
                  activeId === `player:${seat.id}` ? "is-dragging" : ""
                } ${
                  placingReminder || snapPreview?.seatId === seat.id
                    ? "is-reminder-target"
                    : ""
                }`}
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
              >
                <PlayerToken
                  seat={seat}
                  selected={selectedSeatId === seat.id}
                  tokenSize={tokenSize}
                  labelSide={playerLabelSides.get(seat.id) ?? "bottom"}
                  onSelect={() =>
                    placingReminder
                      ? onPlaceReminder(seat.id)
                      : onSelectSeat(seat.id)
                  }
                  onRename={(playerName) => onRenameSeat(seat.id, playerName)}
                />
              </div>
            );
          })}
          {reminders.map((reminder) => {
            const isDragging = activeId === `reminder:${reminder.id}`;
            const position = isDragging
              ? reminderPositions.get(reminder.id)
              : displayReminderPositions.get(reminder.id);
            const seat = seats.find(
              (candidate) => candidate.id === reminder.seatId,
            );
            if (!position || !seat) return null;

            return (
              <div
                key={reminder.id}
                className={`canvas-reminder-position ${
                  isDragging ? "is-dragging" : ""
                } ${
                  reflowingReminderIds.has(reminder.id) ? "is-reflowing" : ""
                }`}
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
              >
                <DraggableReminderToken
                  reminder={reminder}
                  playerName={seat.playerName}
                  size={reminderSize}
                  selected={selectedReminderId === reminder.id}
                  onSelect={() => onSelectReminder(reminder.id)}
                  onRemove={() => onRemoveReminder(reminder.id)}
                />
              </div>
            );
          })}
          {snapPreview && activeReminderId && (
            <div
              className="reminder-snap-preview"
              style={{
                left: `${snapPreview.position.x}%`,
                top: `${snapPreview.position.y}%`,
                width: reminderSize,
                height: reminderSize,
              }}
              aria-hidden="true"
            />
          )}
          {selectedSeat && playerMenu && (
            <PlayerContextMenu
              editionId={editionId}
              seat={selectedSeat}
              seats={seats}
              gameTokens={gameTokens}
              side={playerMenu.side}
              style={
                {
                  left: playerMenu.left,
                  top: playerMenu.top,
                  width: playerMenu.width,
                  "--player-menu-anchor-y": `${playerMenu.anchorOffset}px`,
                } as CSSProperties
              }
              onClose={onClearSelection}
              onChooseRole={() => onChooseRole(selectedSeat.id)}
              onRename={(playerName) =>
                onRenameSeat(selectedSeat.id, playerName)
              }
              onSetAlive={(alive) => onSetAlive(selectedSeat.id, alive)}
              onSetAlignment={(alignment) =>
                onSetAlignment(selectedSeat.id, alignment)
              }
              onSetGhostVote={(available) =>
                onSetGhostVote(selectedSeat.id, available)
              }
              onSetTraveller={(isTraveller) =>
                onSetTraveller(selectedSeat.id, isTraveller)
              }
              onAddReminder={(definition) =>
                onAddReminder(selectedSeat.id, definition)
              }
              onRemovePlayer={() => onRemovePlayer(selectedSeat.id)}
            />
          )}
        </div>
      </div>
    </DndContext>
  );
}
