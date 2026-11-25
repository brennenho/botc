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
    expect(screen.getByRole("button", { name: "Drunk" })).toBeDisabled();
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
