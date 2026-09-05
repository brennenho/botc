// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GrimoireToolbar } from "@/components/grimoire/grimoire-toolbar";
import { TooltipProvider } from "@/components/ui/tooltip";

vi.mock("@/components/grimoire/game-invite-control", () => ({
  GameInviteControl: () => null,
}));

afterEach(() => cleanup());

describe("GrimoireToolbar", () => {
  it("uses a compact icon for the keyboard shortcut guide", async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delay={0} closeDelay={0}>
        <GrimoireToolbar
          editionId="tb"
          joinCode="ABC234"
          actorRole="storyteller"
          redacted={false}
          onRedactedChange={vi.fn()}
        />
      </TooltipProvider>,
    );

    const button = screen.getByRole("button", {
      name: "Open keyboard shortcuts",
    });

    expect(button).toHaveClass("toolbar-shortcuts-button");
    expect(button).toHaveAttribute("aria-keyshortcuts", "G");
    expect(button).not.toHaveTextContent("Keys");

    await user.hover(button);

    const tooltip = (await screen.findByText("Keyboard shortcuts")).closest(
      ".site-tooltip-popup",
    );
    expect(tooltip).toHaveTextContent("G");
  });
});
