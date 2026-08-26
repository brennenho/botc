// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PlayerReminderPicker } from "@/components/storyteller/player-reminder-picker";
import { roleById } from "@/lib/game-data";
import type { EditionId, GameToken } from "@/lib/game-data/types";
import {
  getReminderDefinition,
  withReminderKey,
  type ReminderDefinition,
} from "@/lib/reminders";

const poisoner = roleById.get("poisoner")!;
const poisoned = getReminderDefinition(poisoner, "Poisoned");
const innkeeper = roleById.get("innkeeper")!;
const safe = getReminderDefinition(innkeeper, "Safe");

function reminder(
  definition: ReminderDefinition,
  id: string,
  seatId: string,
  position = 0,
): GameToken {
  return {
    id,
    seatId,
    tokenType: "reminder",
    roleId: definition.roleId,
    label: definition.label,
    position,
    metadata: withReminderKey({}, definition.key),
  };
}

afterEach(() => cleanup());

describe("PlayerReminderPicker", () => {
  function renderPicker(gameTokens: GameToken[], editionId: EditionId = "tb") {
    render(
      <PlayerReminderPicker
        editionId={editionId}
        targetSeatId="seat-a"
        playerName="Alice"
        gameTokens={gameTokens}
        onBack={vi.fn()}
        onClose={vi.fn()}
        onAddReminder={vi.fn()}
      />,
    );
  }

  it("changes the accessible action without adding visible UI", () => {
    renderPicker([reminder(poisoned, "poisoned-token", "seat-b")]);

    const action = screen.getByRole("button", {
      name: "Move Poisoned reminder to Alice",
    });
    expect(action).toBeEnabled();
    expect(
      screen.queryByText("Move Poisoned reminder to Alice"),
    ).not.toBeInTheDocument();
  });

  it("disables a spent reminder already placed on the selected player", () => {
    renderPicker([reminder(poisoned, "poisoned-token", "seat-a")]);

    expect(
      screen.getByRole("button", {
        name: "Poisoned reminder already on Alice",
      }),
    ).toBeDisabled();
  });

  it("keeps adding while a physical copy remains", () => {
    renderPicker([reminder(safe, "safe-one", "seat-b")], "bmr");

    expect(
      screen.getByRole("button", {
        name: "Add Safe reminder to Alice",
      }),
    ).toBeEnabled();
  });

  it("moves a multi-copy reminder after its supply is exhausted", () => {
    renderPicker(
      [
        reminder(safe, "safe-one", "seat-b"),
        reminder(safe, "safe-two", "seat-c", 1),
      ],
      "bmr",
    );

    expect(
      screen.getByRole("button", {
        name: "Move Safe reminder to Alice",
      }),
    ).toBeEnabled();
  });

  it("disables a multi-copy reminder when every copy is on the target", () => {
    renderPicker(
      [
        reminder(safe, "safe-one", "seat-a"),
        reminder(safe, "safe-two", "seat-a", 1),
      ],
      "bmr",
    );

    expect(
      screen.getByRole("button", {
        name: "Safe reminder already on Alice",
      }),
    ).toBeDisabled();
  });
});
