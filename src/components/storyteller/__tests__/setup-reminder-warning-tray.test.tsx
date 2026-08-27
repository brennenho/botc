// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SetupReminderWarningTray } from "@/components/storyteller/setup-reminder-warning-tray";
import { roleById } from "@/lib/game-data";
import type { SetupReminderWarning } from "@/lib/game-data/types";
import { getReminderDefinition } from "@/lib/reminders";

const warnings: SetupReminderWarning[] = [
  {
    roleId: "washerwoman",
    roleName: "Washerwoman",
    missing: [
      { label: "Townsfolk", count: 1 },
      { label: "Wrong", count: 1 },
    ],
  },
  {
    roleId: "tealady",
    roleName: "Tea Lady",
    missing: [{ label: "Cannot Die", count: 2 }],
  },
];

afterEach(() => cleanup());

describe("SetupReminderWarningTray", () => {
  it("turns each missing reminder into its physical reminder action", async () => {
    const user = userEvent.setup();
    const onSelectReminder = vi.fn();
    render(
      <SetupReminderWarningTray
        warnings={warnings}
        pendingReminderKey={null}
        onSelectReminder={onSelectReminder}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Place Cannot Die reminder from Tea Lady; 2 copies missing",
      }),
    );

    expect(onSelectReminder).toHaveBeenCalledWith(
      getReminderDefinition(roleById.get("tealady")!, "Cannot Die"),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "4 setup reminders missing.",
    );
  });

  it("exposes and preserves the compact tray state during placement", async () => {
    const user = userEvent.setup();
    const onSelectReminder = vi.fn();
    const { rerender } = render(
      <SetupReminderWarningTray
        warnings={warnings}
        pendingReminderKey={null}
        onSelectReminder={onSelectReminder}
      />,
    );

    const summary = screen.getByRole("button", {
      name: "Show 4 missing setup reminders",
    });
    await user.click(summary);
    expect(summary).toHaveAttribute("aria-expanded", "true");
    expect(summary).toHaveAccessibleName("Hide 4 missing setup reminders");

    const definition = getReminderDefinition(
      roleById.get("washerwoman")!,
      "Townsfolk",
    );
    rerender(
      <SetupReminderWarningTray
        warnings={warnings}
        pendingReminderKey={definition.key}
        onSelectReminder={onSelectReminder}
      />,
    );
    expect(summary).toHaveAttribute("aria-expanded", "false");

    rerender(
      <SetupReminderWarningTray
        warnings={warnings}
        pendingReminderKey={null}
        onSelectReminder={onSelectReminder}
      />,
    );
    expect(summary).toHaveAttribute("aria-expanded", "true");
  });

  it("marks the armed reminder and returns focus when placement ends", async () => {
    const user = userEvent.setup();
    const onSelectReminder = vi.fn();
    const definition = getReminderDefinition(
      roleById.get("washerwoman")!,
      "Wrong",
    );
    const { rerender } = render(
      <SetupReminderWarningTray
        warnings={warnings}
        pendingReminderKey={null}
        onSelectReminder={onSelectReminder}
      />,
    );
    const action = screen.getByRole("button", {
      name: "Place Wrong reminder from Washerwoman; 1 copy missing",
    });

    await user.click(action);
    rerender(
      <SetupReminderWarningTray
        warnings={warnings}
        pendingReminderKey={definition.key}
        onSelectReminder={onSelectReminder}
      />,
    );
    expect(action).toHaveAttribute("aria-pressed", "true");

    rerender(
      <SetupReminderWarningTray
        warnings={warnings}
        pendingReminderKey={null}
        onSelectReminder={onSelectReminder}
      />,
    );
    expect(action).toHaveFocus();
    expect(action).toHaveAttribute("aria-pressed", "false");
  });
});
