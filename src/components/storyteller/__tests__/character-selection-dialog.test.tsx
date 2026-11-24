// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CharacterSelectionDialog } from "@/components/storyteller/character-selection-dialog";
import { RoleDistributionDialog } from "@/components/storyteller/role-distribution-dialog";

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
        residentCount={7}
        travellerCount={0}
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
});
