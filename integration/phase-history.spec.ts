import {
  createGameViaApi,
  expect,
  getPlayerSnapshot,
  joinGameViaApi,
  test,
} from "./fixtures/multiplayer";

test("starting mid-game publishes one phase to another open Game history", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const { context, page } = storyteller;
  const { snapshot } = await createGameViaApi(storyteller);
  const path = `/game/${snapshot.game.joinCode}/storyteller`;
  const observer = await context.newPage();
  for (const tab of [page, observer]) {
    await tab.goto(path);
    await tab.getByRole("button", { name: "Game", exact: true }).click();
  }
  await observer.getByRole("tab", { name: "History" }).click();
  await expect(
    observer.getByText("Phase changes appear here once you start tracking."),
  ).toBeVisible();
  await page.getByText("Start mid-game").click();
  await page.getByRole("combobox", { name: "Phase" }).selectOption("day");
  await page.getByLabel("Number", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Start tracking" }).click();
  await expect(
    observer
      .getByRole("list", { name: "Phase history" })
      .getByRole("listitem")
      .locator("span"),
  ).toHaveText(["Day 3 began"], { timeout: 20_000 });
  await expect(
    observer.getByRole("button", { name: "Begin Night 4" }),
  ).toBeHidden();
  await observer.getByRole("tab", { name: "Night order" }).click();
  await expect(
    observer.getByRole("button", { name: "Begin Night 4" }),
  ).toBeVisible();
});

test("@ipad Storyteller tracks phases and each night starts a fresh checklist", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const player = await createActor();
  const { snapshot } = await createGameViaApi(storyteller);
  const code = snapshot.game.joinCode;
  const { seatId } = await joinGameViaApi(player, code, "Mei");
  const { page } = storyteller;
  await page.goto(`/game/${code}/storyteller`);
  const button = (name: string | RegExp) =>
    page.getByRole("button", { name, exact: true });
  await button("Game").click();
  const views = page.getByRole("tablist", { name: "Game views" });
  const nightOrder = views.getByRole("tab", { name: "Night order" });
  const history = views.getByRole("tab", { name: "History" });
  await expect(nightOrder).toHaveAttribute("aria-selected", "true");
  await expect(button(/^Back to /)).toHaveCount(0);
  await button("Begin Night 1").click();
  await button("Back to Setup").click();
  await button("Begin Night 1").click();
  await button("Begin Day 1").click();
  await button("Begin Night 2").click();
  await history.click();
  await expect(
    page
      .getByRole("list", { name: "Phase history" })
      .getByRole("listitem")
      .locator("span"),
  ).toHaveText([
    "Night 2 began",
    "Day 1 began",
    "Night 1 began",
    "Returned to Setup",
    "Night 1 began",
  ]);
  await history.press("ArrowLeft");
  await expect(nightOrder).toBeFocused();
  const dusk = button(/Dusk/);
  await dusk.click();
  await expect(dusk.locator("..")).toHaveClass(/is-complete/);
  await page.reload();
  await button("Game").click();
  await expect(dusk.locator("..")).toHaveClass(/is-complete/);
  await button("Begin Day 2").click();
  await button("Begin Night 3").click();
  await expect(dusk.locator("..")).not.toHaveClass(/is-complete/);
  const dawn = button(/Dawn/);
  await dawn.click();
  await button("Back to Day 2").click();
  await button("Back to Night 2").click();
  await expect(dusk.locator("..")).toHaveClass(/is-complete/);
  await expect(dawn.locator("..")).not.toHaveClass(/is-complete/);
  await history.click();
  await expect(
    page
      .getByRole("list", { name: "Phase history" })
      .getByRole("listitem")
      .first()
      .locator("span"),
  ).toHaveText("Returned to Night 2");
  await button("Players").click();
  await button("Game").click();
  await expect(nightOrder).toHaveAttribute("aria-selected", "true");
  await button("Begin Day 2").click();
  await button("Begin Night 3").click();
  await expect(dawn.locator("..")).toHaveClass(/is-complete/);
  await expect(button("Begin Day 3")).toBeEnabled();
  const result = await getPlayerSnapshot(player, code, seatId);
  expect(result.snapshot.game).toMatchObject({ phase: "night", dayNumber: 3 });
  expect(result.snapshot).not.toHaveProperty("events");
});
