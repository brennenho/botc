// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GrimoirePanelTabs } from "@/components/grimoire/grimoire-panel-tabs";
import { TooltipProvider } from "@/components/ui/tooltip";

afterEach(() => cleanup());

describe("GrimoirePanelTabs", () => {
  it("places hints beside a vertical rail", async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delay={0} closeDelay={0}>
        <GrimoirePanelTabs
          sheetOpen={false}
          tabs={[
            {
              id: "night-order",
              icon: <span aria-hidden="true">N</span>,
              label: "Night Order",
              shortcut: "N",
              onClick: vi.fn(),
            },
          ]}
        />
      </TooltipProvider>,
    );

    await user.hover(screen.getByRole("button", { name: "Night Order" }));

    await waitFor(() =>
      expect(document.querySelector(".site-tooltip-popup")).toBeVisible(),
    );

    const hint = document.querySelector(".site-tooltip-popup");
    expect(hint?.parentElement).toHaveAttribute("data-preferred-side", "left");
    expect(
      screen.getByRole("navigation", { name: "Grimoire Panels" }),
    ).toHaveAttribute("data-orientation", "vertical");
  });
});
