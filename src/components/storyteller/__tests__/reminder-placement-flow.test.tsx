// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NightOrderPanel } from "@/components/storyteller/night-order-sheet";
import { StorytellerDock } from "@/components/storyteller/storyteller-dock";
import { Sheet } from "@/components/ui/sheet";
import { roleById } from "@/lib/game-data";
import type { NightOrderState } from "@/lib/night-order-state";
import {
  getReminderDefinition,
  type ReminderDefinition,
} from "@/lib/reminders";

const poisoner = roleById.get("poisoner")!;
const poisonedReminder = getReminderDefinition(poisoner, "Poisoned");

afterEach(() => cleanup());

describe("Night Order reminder placement", () => {
  it("keeps a suspended sheet mounted and ignores its Escape dismissal", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Sheet
        open
        suspended
        title="Night Order"
        modal={false}
        onOpenChange={onOpenChange}
      >
        <button type="button">Retained Place action</button>
      </Sheet>,
    );

    const sheet = document.body.querySelector(".side-sheet");
    expect(sheet).toHaveClass("is-suspended");
    expect(sheet).toHaveAttribute("data-suspended", "");
    expect(sheet).toHaveAttribute("inert", "");
    expect(sheet).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Retained Place action")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("still lets a visible sheet close with Escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Sheet open title="Night Order" modal={false} onOpenChange={onOpenChange}>
        <button type="button">Place action</button>
      </Sheet>,
    );

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("ignores an Escape already handled by an app shortcut", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const handleKeyDown = (event: KeyboardEvent) => event.preventDefault();
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    try {
      render(
        <Sheet
          open
          title="Night Order"
          modal={false}
          onOpenChange={onOpenChange}
        >
          <button type="button">Place action</button>
        </Sheet>,
      );

      await user.keyboard("{Escape}");
      expect(onOpenChange).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    }
  });

  it("focuses the placement prompt without reserving hidden sheet space", () => {
    const { rerender } = render(
      <StorytellerDock
        selectedReminder={null}
        reminderOwner={null}
        pendingReminder={poisonedReminder}
        playersOpen={false}
        nightOpen
        infoOpen={false}
        scriptOpen={false}
        sheetVisible={false}
        onOpenPlayers={() => undefined}
        onOpenNight={() => undefined}
        onOpenInfo={() => undefined}
        onOpenScript={() => undefined}
        onRemoveSelectedReminder={() => undefined}
        onCloseSelectedReminder={() => undefined}
        onCancelReminderPlacement={() => undefined}
      />,
    );

    const placementPrompt = screen.getByRole("region", {
      name: "Place Poisoned",
    });
    expect(placementPrompt).toHaveFocus();
    expect(
      screen.getByRole("navigation", { name: "Grimoire Panels" }),
    ).not.toHaveClass("is-sheet-open");
    expect(screen.getByRole("button", { name: "Night Order" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    rerender(
      <StorytellerDock
        selectedReminder={null}
        reminderOwner={null}
        pendingReminder={poisonedReminder}
        playersOpen={false}
        nightOpen
        infoOpen={false}
        scriptOpen={false}
        sheetVisible
        onOpenPlayers={() => undefined}
        onOpenNight={() => undefined}
        onOpenInfo={() => undefined}
        onOpenScript={() => undefined}
        onRemoveSelectedReminder={() => undefined}
        onCloseSelectedReminder={() => undefined}
        onCancelReminderPlacement={() => undefined}
      />,
    );

    expect(placementPrompt).toHaveClass("is-sheet-adjacent");
    expect(
      screen.getByRole("navigation", { name: "Grimoire Panels" }),
    ).toHaveClass("is-sheet-open");
  });

  it("returns focus to the Place action after placement ends", async () => {
    const user = userEvent.setup();
    render(<NightOrderFocusHarness />);

    const placeAction = screen.getByRole("button", {
      name: /^Place Poisoned on the chosen player\./,
    });
    await user.click(placeAction);
    await user.click(screen.getByRole("button", { name: "Finish placement" }));

    expect(
      screen.getByRole("button", {
        name: /^Place Poisoned on the chosen player\./,
      }),
    ).toHaveFocus();
  });
});

function NightOrderFocusHarness() {
  const [pendingReminder, setPendingReminder] =
    useState<ReminderDefinition | null>(null);
  const [state, setState] = useState<NightOrderState>({
    night: "first",
    scope: "all",
    completed: {},
  });

  return (
    <>
      <NightOrderPanel
        shortcutsEnabled={pendingReminder === null}
        editionId="tb"
        seats={[]}
        gameTokens={[]}
        state={state}
        pendingReminder={pendingReminder}
        onStateChange={setState}
        onPlaceReminder={(role, action) =>
          setPendingReminder(getReminderDefinition(role, action.label))
        }
        onCancelReminderPlacement={() => setPendingReminder(null)}
        onReveal={() => undefined}
      />
      <button type="button" onClick={() => setPendingReminder(null)}>
        Finish placement
      </button>
    </>
  );
}
