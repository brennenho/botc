import {
  createGameViaApi,
  expect,
  getPlayerSnapshot,
  joinGameViaApi,
  test,
} from "./fixtures/multiplayer";

test("starting mid-game publishes one phase to another open History panel", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const { context, page } = storyteller;
  const { snapshot } = await createGameViaApi(storyteller);
  const path = `/game/${snapshot.game.joinCode}/storyteller`;
  const observer = await context.newPage();
  for (const tab of [page, observer]) {
    await tab.goto(path);
    await tab.getByRole("button", { name: "Game history, Setup" }).click();
  }
  await page.getByText("Start mid-game").click();
  await page.getByRole("combobox", { name: "Phase" }).selectOption("day");
  await page.getByLabel("Number", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Start tracking" }).click();
  await expect(
    observer.getByRole("list", { name: "Phase history" }).getByRole("listitem"),
  ).toHaveText(["Day 3 began"], { timeout: 20_000 });
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
  await button("Game history, Setup").click();
  await button("Begin Night 1").click();
  await button("Begin Day 1").click();
  await button("Begin Night 2").click();
  await expect(
    page.getByRole("list", { name: "Phase history" }).getByRole("listitem"),
  ).toHaveText(["Night 2 began", "Day 1 began", "Night 1 began"]);
  await button("Close Game history").click();
  await button("Night Order").click();
  const dusk = button(/Dusk/);
  await dusk.click();
  await expect(dusk.locator("..")).toHaveClass(/is-complete/);
  await page.reload();
  await button("Night Order").click();
  await expect(dusk.locator("..")).toHaveClass(/is-complete/);
  await button("Game history, Night 2").click();
  await button("Begin Day 2").click();
  await button("Begin Night 3").click();
  await expect(
    page.getByRole("list", { name: "Phase history" }).getByRole("listitem"),
  ).toHaveCount(5);
  await button("Close Game history").click();
  await button("Night Order").click();
  await expect(dusk).toBeVisible();
  await expect(dusk.locator("..")).not.toHaveClass(/is-complete/);
  const result = await getPlayerSnapshot(player, code, seatId);
  expect(result.snapshot.game).toMatchObject({ phase: "night", dayNumber: 3 });
  expect(result.snapshot).not.toHaveProperty("events");
});
