// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PlayerReminderPicker } from "@/components/storyteller/player-reminder-picker";
import { roleById } from "@/lib/game-data";
import type { GameToken, Seat } from "@/lib/game-data/types";
import { getReminderDefinition, withReminderKey } from "@/lib/reminders";

const poisoner = roleById.get("poisoner")!;
const poisoned = getReminderDefinition(poisoner, "Poisoned");

function seat(id: string, seatIndex: number, roleId: string | null): Seat {
  return {
    id,
    seatIndex,
    playerName: seatIndex === 0 ? "Alice" : "Bob",
    claimedByPlayer: false,
    roleId,
    alignment: "good",
    alive: true,
    ghostVoteAvailable: true,
    isTraveller: false,
    joinedAt: "2026-01-01T00:00:00.000Z",
  };
}

function reminder(seatId: string): GameToken {
  return {
    id: "poisoned-token",
    seatId,
    tokenType: "reminder",
    roleId: poisoner.id,
    label: poisoned.label,
    position: 0,
    metadata: withReminderKey({}, poisoned.key),
  };
}

afterEach(() => cleanup());

describe("PlayerReminderPicker", () => {
  const seats = [seat("seat-a", 0, poisoner.id), seat("seat-b", 1, null)];

  function renderPicker(gameTokens: GameToken[]) {
    render(
      <PlayerReminderPicker
        editionId="tb"
        seat={seats[0]!}
        seats={seats}
        gameTokens={gameTokens}
        onBack={vi.fn()}
        onClose={vi.fn()}
        onAddReminder={vi.fn()}
      />,
    );
  }

  it("changes the accessible action without adding visible UI", () => {
    renderPicker([reminder("seat-b")]);

    const actions = screen.getAllByRole("button", { name: "Move Poisoned" });
    expect(actions).toHaveLength(2);
    expect(actions.every((action) => !action.hasAttribute("disabled"))).toBe(
      true,
    );
    expect(screen.queryByText("Move Poisoned")).not.toBeInTheDocument();
  });

  it("disables a spent reminder already placed on the selected player", () => {
    renderPicker([reminder("seat-a")]);

    const actions = screen.getAllByRole("button", {
      name: "Poisoned already on Alice",
    });
    expect(actions).toHaveLength(2);
    expect(actions.every((action) => action.hasAttribute("disabled"))).toBe(
      true,
    );
  });
});
