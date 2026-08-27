// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { RoleInfoButton } from "@/components/storyteller/role-info-button";
import { roleById } from "@/lib/game-data";

afterEach(() => cleanup());

describe("RoleInfoButton", () => {
  it("opens character information when pressed", async () => {
    const user = userEvent.setup();
    const role = roleById.get("washerwoman")!;

    render(<RoleInfoButton role={role} />);

    await user.click(
      screen.getByRole("button", { name: `About ${role.name}` }),
    );

    const ability = await screen.findByText(role.ability);

    expect(ability).toBeVisible();
    expect(screen.getByRole("heading", { name: role.name })).toBeVisible();
    expect(ability.closest(".role-ability-popover")).toHaveClass(
      "site-floating-help-popup",
    );
  });
});
