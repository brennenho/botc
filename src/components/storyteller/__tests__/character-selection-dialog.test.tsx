// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CharacterSelectionDialog } from "@/components/storyteller/character-selection-dialog";
import { RoleDistributionDialog } from "@/components/storyteller/role-distribution-dialog";

import { createSeat } from "@/lib/game-state";

const script = { name: "Test script", roleIds: ["villageidiot", "imp"] };

afterEach(cleanup);

describe("character selection", () => {
  it("shows the role name and assignment status in the selectable row", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <CharacterSelectionDialog
        open
        title="Choose a Character"
        closeLabel="Close Character Picker"
        selectionMode="single"
        editionId={script}
        teams={["townsfolk", "demon"]}
        selectedRoleId="villageidiot"
        usedRoleIds={["villageidiot"]}
        bluffRoleIds={["villageidiot"]}
        onOpenChange={vi.fn()}
        onSelect={onSelect}
      />,
    );

    const role = screen.getByRole("button", {
      name: "Village Idiot, in play, demon bluff",
    });
    expect(role).toHaveTextContent("Village Idiot");
    expect(role).toHaveTextContent("In play · Demon bluff");
    expect(role).toHaveAttribute("aria-current", "true");
    expect(
      screen.queryByRole("group", { name: "Village Idiot copies" }),
    ).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "About Village Idiot" }),
    );
    expect(onSelect).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    await user.click(role);
    expect(onSelect).toHaveBeenCalledWith("villageidiot");
  });

  it("keeps pool selection and copy adjustment independent on the same row", async () => {
    const user = userEvent.setup();
    render(
      <RoleDistributionDialog
        open
        editionId={script}
        gameTokens={[]}
        seats={Array.from({ length: 7 }, (_, i) => createSeat(i))}
        onOpenChange={vi.fn()}
        onDistribute={vi.fn()}
      />,
    );

    const role = screen.getByRole("button", {
      name: "Village Idiot",
    });
    expect(role).toHaveTextContent("Village Idiot");
    await user.click(role);
    await user.click(
      screen.getByRole("button", { name: "Add one Village Idiot" }),
    );
    expect(role).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Village Idiot count")).toHaveTextContent("2");
    await user.click(role);
    expect(role).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("Village Idiot count")).toHaveTextContent("0");
  });

  it("shows on-script and off-script roles behind one Traveller disclosure", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <CharacterSelectionDialog
        open
        title="Choose a Character"
        closeLabel="Close Character Picker"
        selectionMode="single"
        editionId="tb"
        teams={["traveller"]}
        selectedRoleId="barista"
        usedRoleIds={[]}
        bluffRoleIds={[]}
        onOpenChange={vi.fn()}
        onSelect={onSelect}
      />,
    );
    const toggle = screen.getByRole("button", { name: "Travellers" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("button", { expanded: true })).toEqual([toggle]);
    expect(screen.getByRole("button", { name: "Bureaucrat" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Barista" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await user.click(toggle);
    expect(screen.queryByRole("button", { name: "Barista" })).toBeNull();
    await user.click(toggle);
    await user.click(screen.getByRole("button", { name: "Barista" }));
    expect(onSelect).toHaveBeenCalledWith("barista");
  });

  it("counts a fixed Demon and draws only the newly selected roles, including Travellers", async () => {
    const user = userEvent.setup();
    const onDistribute = vi.fn();
    const seats = Array.from({ length: 7 }, (_, i) => createSeat(i));
    seats[0] = {
      ...seats[0]!,
      roleId: "imp",
      playerName: "Sam",
      alignment: "evil",
    };
    render(
      <RoleDistributionDialog
        open
        editionId="tb"
        seats={seats}
        gameTokens={[]}
        onOpenChange={vi.fn()}
        onDistribute={onDistribute}
      />,
    );
    const demon = screen.getByRole("heading", { name: /^Demons/ });
    expect(
      within(demon).getByLabelText("1 in setup, 1 expected"),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Imp, Assigned to Sam" }),
    ).toBeDisabled();
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.at(-1)).toHaveTextContent("Travellers");
    const travellers = screen.getByRole("button", { name: "Travellers" });
    expect(travellers).toHaveAttribute("aria-expanded", "false");
    await user.click(travellers);
    await user.click(screen.getByRole("button", { name: "Barista" }));
    expect(
      within(
        screen.getByRole("heading", { name: /^Townsfolk/ }),
      ).getByLabelText("0 in setup, 3 expected"),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(
      within(demon).getByLabelText("1 in setup, 1 expected"),
    ).toBeVisible();
    expect(
      within(
        screen.getByRole("heading", { name: /^Townsfolk/ }),
      ).getByLabelText("0 in setup, 5 expected"),
    ).toBeVisible();
    for (const name of [
      "Barista",
      "Chef",
      "Monk",
      "Empath",
      "Saint",
      "Poisoner",
    ]) {
      await user.click(screen.getByRole("button", { name }));
    }
    expect(
      screen.getByText("6 selected for 6 unassigned players"),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Distribute Roles" }));
    expect(onDistribute).toHaveBeenCalledWith([
      "barista",
      "chef",
      "monk",
      "empath",
      "saint",
      "poisoner",
    ]);
  });

  it("counts assigned copies in the stepper and leaves them in place when clearing the selection", async () => {
    const user = userEvent.setup();
    const seats = [
      { ...createSeat(0), roleId: "villageidiot" },
      createSeat(1),
      createSeat(2),
      createSeat(3),
    ];
    render(
      <RoleDistributionDialog
        open
        editionId={script}
        seats={seats}
        gameTokens={[]}
        onOpenChange={vi.fn()}
        onDistribute={vi.fn()}
      />,
    );
    const add = screen.getByRole("button", { name: "Add one Village Idiot" });
    const remove = screen.getByRole("button", {
      name: "Remove one Village Idiot",
    });
    expect(remove).toBeDisabled();
    await user.click(add);
    await user.click(add);
    expect(screen.getByLabelText("Village Idiot count")).toHaveTextContent("3");
    expect(add).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(screen.getByLabelText("Village Idiot count")).toHaveTextContent("1");
    expect(remove).toBeDisabled();
  });

  it("counts a directly assigned Drunk as one occupied seat", async () => {
    const user = userEvent.setup();
    const seats = [
      "washerwoman",
      "librarian",
      "chef",
      "drunk",
      "poisoner",
      null,
    ].map((roleId, i) => ({ ...createSeat(i), roleId }));
    const onDistribute = vi.fn();
    render(
      <RoleDistributionDialog
        open
        editionId="tb"
        seats={seats}
        gameTokens={[]}
        onOpenChange={vi.fn()}
        onDistribute={onDistribute}
      />,
    );
    expect(
      within(
        screen.getByRole("heading", { name: /^Townsfolk/ }),
      ).getByLabelText("3 in setup, 3 expected"),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Drunk, Assigned to Player 4" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Imp" }));
    await user.click(screen.getByRole("button", { name: "Distribute Roles" }));
    expect(onDistribute).toHaveBeenCalledWith(["imp"]);
  });

  it("accounts for a manually assigned Baron and allows an already full roster to be inspected", () => {
    const seats = [
      "chef",
      "empath",
      "monk",
      "saint",
      "butler",
      "baron",
      "imp",
    ].map((roleId, i) => ({ ...createSeat(i), roleId }));
    render(
      <RoleDistributionDialog
        open
        editionId="tb"
        seats={seats}
        gameTokens={[]}
        onOpenChange={vi.fn()}
        onDistribute={vi.fn()}
      />,
    );
    expect(
      within(
        screen.getByRole("heading", { name: /^Outsiders/ }),
      ).getByLabelText("2 in setup, 2 expected"),
    ).toBeVisible();
    expect(screen.getByText("All players have a role.")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Distribute Roles" }),
    ).toBeDisabled();
  });
});
