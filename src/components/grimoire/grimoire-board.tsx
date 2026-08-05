"use client";

import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useEffect, useRef, useState } from "react";

import {
  CanvasReminderToken,
  PlayerToken,
} from "@/components/grimoire/player-token";
import type { GameToken, Seat } from "@/lib/game-data/types";
import {
  clampCanvasPosition,
  getPlayerPosition,
  getReminderPosition,
  type CanvasPosition,
} from "@/lib/grimoire-canvas";
import { getTriangularReminderOffset } from "@/lib/reminder-layout";

export function GrimoireBoard({
  seats,
  gameTokens,
  selectedSeatId,
  onSelectSeat,
  onClearSelection,
  onRenameSeat,
  onMovePlayer,
  onMoveReminder,
}: {
  seats: Seat[];
  gameTokens: GameToken[];
  selectedSeatId: string | null;
  onSelectSeat: (seatId: string) => void;
  onClearSelection: () => void;
  onRenameSeat: (seatId: string, playerName: string) => void;
  onMovePlayer: (seatId: string, position: CanvasPosition) => void;
  onMoveReminder: (tokenId: string, position: CanvasPosition) => void;
}) {
  const tokenSize = Math.round(
    Math.max(66, Math.min(112, 1440 / (seats.length + 5))),
  );
  const reminderSize = Math.max(26, Math.min(36, tokenSize * 0.36));
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState({ width: 1000, height: 700 });
  const [activeId, setActiveId] = useState<string | null>(null);
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
  const reminders = gameTokens.filter(
    (token) => token.tokenType === "reminder",
  );
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
    const seatReminders = reminders.filter((token) => token.seatId === seat.id);
    const reminderIndex = seatReminders.findIndex(
      (token) => token.id === reminder.id,
    );
    const deltaX = ((playerPosition.x - 50) / 100) * boardSize.width;
    const deltaY = ((playerPosition.y - 50) / 100) * boardSize.height;
    const outwardAngle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
    const offset = getTriangularReminderOffset({
      index: reminderIndex,
      count: seatReminders.length,
      outwardAngle,
      playerSize: tokenSize,
      reminderSize,
      clearance: Math.max(6, tokenSize * 0.07),
      gap: Math.max(6, reminderSize * 0.2),
    });
    reminderPositions.set(reminder.id, {
      x: playerPosition.x + (offset.x / boardSize.width) * 100,
      y: playerPosition.y + (offset.y / boardSize.height) * 100,
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const id = String(event.active.id);
    const [kind, tokenId] = id.split(":");
    const current =
      kind === "player"
        ? playerPositions.get(tokenId ?? "")
        : reminderPositions.get(tokenId ?? "");
    setActiveId(null);
    if (!current || !tokenId) return;

    const size = kind === "player" ? tokenSize : reminderSize;
    const position = clampCanvasPosition(
      {
        x: current.x + (event.delta.x / boardSize.width) * 100,
        y: current.y + (event.delta.y / boardSize.height) * 100,
      },
      ((size / 2 + 8) / boardSize.width) * 100,
      ((size / 2 + 8) / boardSize.height) * 100,
    );

    if (kind === "player") onMovePlayer(tokenId, position);
    if (kind === "reminder") onMoveReminder(tokenId, position);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragCancel(_event: DragCancelEvent) {
    setActiveId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
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
                }`}
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
              >
                <PlayerToken
                  seat={seat}
                  selected={selectedSeatId === seat.id}
                  tokenSize={tokenSize}
                  onSelect={() => onSelectSeat(seat.id)}
                  onRename={(playerName) => onRenameSeat(seat.id, playerName)}
                />
              </div>
            );
          })}
          {reminders.map((reminder) => {
            const position = reminderPositions.get(reminder.id);
            const seat = seats.find(
              (candidate) => candidate.id === reminder.seatId,
            );
            if (!position || !seat) return null;

            return (
              <div
                key={reminder.id}
                className={`canvas-reminder-position ${
                  activeId === `reminder:${reminder.id}` ? "is-dragging" : ""
                }`}
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
              >
                <CanvasReminderToken
                  reminder={reminder}
                  playerName={seat.playerName}
                  size={reminderSize}
                  onSelect={() => onSelectSeat(seat.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}
