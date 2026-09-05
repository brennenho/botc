// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReminderTokenAction } from "@/components/storyteller/reminder-token-action";

afterEach(() => cleanup());

describe("ReminderTokenAction", () => {
  it("owns the complete token action structure", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ReminderTokenAction
        actionLabel="Place Wrong reminder"
        reminderLabel="Wrong"
        roleId="washerwoman"
        tokenSize={48}
        count={1}
        showSingleCount
        selected
        caption="Wrong"
        onClick={onClick}
      />,
    );

    const action = screen.getByRole("button", {
      name: "Place Wrong reminder",
    });
    expect(action).toHaveClass("reminder-token-action", "tactile-action");
    expect(action).toHaveAttribute("aria-pressed", "true");
    expect(action.querySelector(".reminder-token-face")).toHaveClass(
      "tactile-surface",
    );
    expect(action.querySelector(".reminder-token-count")).toHaveTextContent(
      "1",
    );
    expect(
      action.querySelector(".reminder-token-action-caption"),
    ).toHaveTextContent("Wrong");

    await user.click(action);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("keeps passive captions out of the accessible action name", () => {
    render(
      <ReminderTokenAction
        actionLabel="Move Poisoned reminder to Alice"
        reminderLabel="Poisoned"
        roleId="poisoner"
        caption="Poisoned ×2"
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Move Poisoned reminder to Alice",
      }),
    ).toHaveAccessibleName("Move Poisoned reminder to Alice");
  });
});
