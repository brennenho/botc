import {
  createGameViaApi,
  expect,
  joinGameViaApi,
  test,
} from "./fixtures/multiplayer";

test("@ipad Character Reference switches sheets for storytellers and players", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const player = await createActor();
  const { snapshot } = await createGameViaApi(storyteller);
  const code = snapshot.game.joinCode;
  const { seatId } = await joinGameViaApi(player, code, "Mei");
  await storyteller.page.goto(`/game/${code}/storyteller`);
  await player.page.goto(`/game/${code}/player/${seatId}`);

  for (const { page } of [storyteller, player]) {
    const reference = page.getByRole("button", {
      name: "Reference",
      exact: true,
    });
    await reference.click();
    const tabs = page.getByRole("tablist", { name: "Character Reference" });
    const script = tabs.getByRole("tab", { name: "Script" });
    const travellers = tabs.getByRole("tab", { name: "Travellers" });
    await expect(
      page
        .getByRole("tabpanel", { name: "Script" })
        .getByRole("heading", { name: "Trouble Brewing", level: 1 }),
    ).toBeVisible();
    await script.press("ArrowRight");
    await expect(travellers).toBeFocused();
    await expect(travellers).toHaveAttribute("aria-selected", "true");
    await expect(
      page
        .getByRole("tabpanel", { name: "Travellers" })
        .getByRole("heading", { name: "Travellers", level: 1 }),
    ).toBeVisible();

    await reference.click();
    await expect(tabs).toBeHidden();
    await reference.click();
    await expect(travellers).toHaveAttribute("aria-selected", "true");
    await script.click();
    await expect(script).toHaveAttribute("aria-selected", "true");
  }
});
