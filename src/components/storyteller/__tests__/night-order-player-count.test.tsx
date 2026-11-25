// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { NightOrderPanel } from "@/components/storyteller/night-order-sheet";
import { createSeat } from "@/lib/game-state";
import { createDefaultNightOrderState } from "@/lib/night-order-state";

afterEach(cleanup);

function NightOrder({ residents }: { residents: number }) {
  const [state, setState] = useState(createDefaultNightOrderState);
  const seats = Array.from({ length: residents }, (_, i) => ({
    ...createSeat(i),
    alive: i !== 0,
  }));
  seats.push({
    ...createSeat(residents),
    roleId: "bureaucrat",
    isTraveller: true,
  });
  return (
    <NightOrderPanel
      shortcutsEnabled={false}
      editionId="tb"
      seats={seats}
      state={state}
      onStateChange={setState}
      gameTokens={[]}
      pendingReminder={null}
      onPlaceReminder={vi.fn()}
      onCancelReminderPlacement={vi.fn()}
      onReveal={vi.fn()}
    />
  );
}

it("uses resident count for first-night information and honors the override in both scopes", async () => {
  const user = userEvent.setup();
  const { rerender } = render(<NightOrder residents={6} />);
  const minionInfo = () =>
    screen.queryByText("Minion Information", { exact: true });
  const demonInfo = () =>
    screen.queryByText("Demon Information", { exact: true });
  const toggle = () =>
    screen.getByRole("switch", { name: "Minion and Demon info" });
  expect(minionInfo()).not.toBeInTheDocument();
  expect(demonInfo()).not.toBeInTheDocument();
  await user.click(toggle());
  expect(minionInfo()).toBeVisible();
  await user.click(screen.getByRole("button", { name: "All" }));
  expect(demonInfo()).toBeVisible();
  await user.click(toggle());
  expect(demonInfo()).not.toBeInTheDocument();
  rerender(<NightOrder residents={7} />);
  expect(minionInfo()).toBeVisible();
  expect(demonInfo()).toBeVisible();
  expect(screen.queryByRole("switch")).not.toBeInTheDocument();
});
