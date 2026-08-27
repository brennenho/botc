// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";

afterEach(() => cleanup());

describe("Tooltip", () => {
  it("renders shortcut help through the shared popup", async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delay={0} closeDelay={0}>
        <Tooltip content="Open Players" shortcuts={["P"]}>
          <button type="button" aria-label="Open Players">
            Players
          </button>
        </Tooltip>
      </TooltipProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Open Players" });
    expect(trigger).not.toHaveAttribute("title");
    expect(document.querySelector(".site-tooltip-popup")).toBeNull();

    await user.hover(trigger);

    const tooltip = (await screen.findByText("Open Players")).closest(
      ".site-tooltip-popup",
    );
    expect(tooltip).not.toBeNull();
    expect(tooltip).toHaveTextContent("Open Players");
    expect(tooltip?.querySelector("kbd")).toHaveTextContent("P");
    expect(tooltip).toHaveClass(
      "site-floating-help-popup",
      "site-tooltip-popup",
    );
    expect(tooltip?.parentElement).toHaveAttribute(
      "data-preferred-side",
      "top",
    );
  });

  it("opens for keyboard focus", async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delay={0} closeDelay={0}>
        <Tooltip content="Copy Game Code">
          <button type="button">Copy</button>
        </Tooltip>
      </TooltipProvider>,
    );

    await user.tab();

    const tooltip = (await screen.findByText("Copy Game Code")).closest(
      ".site-tooltip-popup",
    );
    expect(tooltip).toHaveTextContent("Copy Game Code");
  });
});
