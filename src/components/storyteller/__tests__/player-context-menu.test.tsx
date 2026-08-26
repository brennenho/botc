// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PlayerContextMenu } from "@/components/storyteller/player-context-menu";
import { roleById } from "@/lib/game-data";
import type { GameToken, Seat } from "@/lib/game-data/types";
import { getReminderDefinition, withReminderKey } from "@/lib/reminders";

vi.mock("@/components/grimoire/character-token", () => ({
  CharacterToken: ({ role }: { role: { name: string } }) => (
    <span data-testid="character-token">{role.name}</span>
  ),
}));

function seat(id: string, seatIndex: number, roleId: string | null): Seat {
  return {
    id,
    seatIndex,
    playerName: `Player ${seatIndex + 1}`,
    claimedByPlayer: false,
    roleId,
    alignment: "good",
    alive: true,
    ghostVoteAvailable: true,
    isTraveller: false,
    joinedAt: "2026-01-01T00:00:00.000Z",
  };
}

function renderMenu(
  roleId: string | null = "washerwoman",
  gameTokens: GameToken[] = [],
) {
  const selectedSeat = seat("seat-1", 0, roleId);
  const callbacks = {
    onClose: vi.fn(),
    onChooseRole: vi.fn(),
    onShowCharacter: vi.fn(),
    onSetAlive: vi.fn(),
    onSetAlignment: vi.fn(),
    onSetGhostVote: vi.fn(),
    onAddReminder: vi.fn(),
  };

  render(
    <PlayerContextMenu
      editionId="tb"
      seat={selectedSeat}
      seats={[selectedSeat, seat("seat-2", 1, "poisoner")]}
      gameTokens={gameTokens}
      shortcutsEnabled={false}
      side="right"
      style={{}}
      {...callbacks}
    />,
  );

  return { callbacks, selectedSeat };
}

afterEach(() => cleanup());

describe("PlayerContextMenu", () => {
  it("offers one clear character action when no character is assigned", () => {
    const { selectedSeat } = renderMenu(null);

    expect(
      screen.getAllByRole("button", {
        name: `Assign a Character to ${selectedSeat.playerName}`,
      }),
    ).toHaveLength(1);
  });

  it("shows the character dossier and in-play reminders immediately", () => {
    const { selectedSeat } = renderMenu();

    expect(
      screen.getByText(roleById.get("washerwoman")!.ability, { exact: true }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Show Character" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: `Add Townsfolk reminder to ${selectedSeat.playerName}`,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: `Add Poisoned reminder to ${selectedSeat.playerName}`,
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Remove Player/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Player Type" }),
    ).not.toBeInTheDocument();
  });

  it("runs live actions without leaving the player menu", async () => {
    const user = userEvent.setup();
    const { callbacks, selectedSeat } = renderMenu();

    await user.click(screen.getByRole("button", { name: "Show Character" }));
    await user.click(
      screen.getByRole("button", {
        name: `Add Poisoned reminder to ${selectedSeat.playerName}`,
      }),
    );

    expect(callbacks.onShowCharacter).toHaveBeenCalledOnce();
    expect(callbacks.onAddReminder).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Poisoned", roleId: "poisoner" }),
    );
    expect(
      screen.getByRole("dialog", {
        name: `${selectedSeat.playerName} controls`,
      }),
    ).toBeVisible();
  });

  it("offers to move an exhausted reminder from another player", () => {
    const poisoned = getReminderDefinition(
      roleById.get("poisoner")!,
      "Poisoned",
    );
    const reminder: GameToken = {
      id: "poisoned-token",
      seatId: "seat-2",
      tokenType: "reminder",
      roleId: poisoned.roleId,
      label: poisoned.label,
      position: 0,
      metadata: withReminderKey({}, poisoned.key),
    };
    const { selectedSeat } = renderMenu("washerwoman", [reminder]);

    expect(
      screen.getByRole("button", {
        name: `Move Poisoned reminder to ${selectedSeat.playerName}`,
      }),
    ).toBeEnabled();
  });

  it("keeps the complete script catalog one level away", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(
      screen.getByRole("button", { name: /All Script Reminders/ }),
    );

    expect(
      screen.getByText("All Script Reminders", { exact: true }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Back" })).toBeVisible();
  });
});
