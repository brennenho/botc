import {
  createGameFromHome,
  expect,
  getStorytellerSnapshot,
  test,
} from "./fixtures/multiplayer";

test("storyteller shortcuts cover common grimoire controls without firing while typing", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const joinCode = await createGameFromHome(storyteller);
  const snapshot = await getStorytellerSnapshot(storyteller, joinCode);
  const firstSeat = [...snapshot.seats].sort(
    (first, second) => first.seatIndex - second.seatIndex,
  )[0]!;

  const shortcutsButton = storyteller.page.getByRole("button", {
    name: "Open shortcut guide",
  });
  const shortcutsHeading = storyteller.page.getByRole("heading", {
    name: "Shortcut guide",
  });
  await shortcutsButton.click();
  await expect(shortcutsHeading).toBeVisible();
  await storyteller.page.keyboard.press("Escape");
  await expect(shortcutsHeading).toBeHidden();

  await storyteller.page.keyboard.press("g");
  await expect(shortcutsHeading).toBeVisible();
  await storyteller.page.keyboard.press("g");
  await expect(shortcutsHeading).toBeHidden();

  await storyteller.page.keyboard.press("j");
  await expect(
    storyteller.page.getByRole("heading", { name: "Invite Players" }),
  ).toBeVisible();
  await storyteller.page.keyboard.press("j");
  await expect(
    storyteller.page.getByRole("heading", { name: "Invite Players" }),
  ).toBeHidden();

  const hideSwitch = storyteller.page.getByRole("switch", {
    name: "Hide",
  });
  await storyteller.page.keyboard.press("h");
  await expect(hideSwitch).toHaveAttribute("aria-checked", "true");
  await storyteller.page.keyboard.press("h");
  await expect(hideSwitch).toHaveAttribute("aria-checked", "false");

  for (const [key, heading] of [
    ["p", "Players"],
    ["n", "Night Order"],
    ["i", "Player Information"],
    ["r", "Character Reference"],
  ] as const) {
    await storyteller.page.keyboard.press(key);
    await expect(
      storyteller.page.getByRole("heading", { name: heading }),
    ).toBeVisible();
    await storyteller.page.keyboard.press(key);
    await expect(
      storyteller.page.getByRole("heading", { name: heading }),
    ).toHaveCount(0);
  }

  await storyteller.page.keyboard.press("p");
  await storyteller.page.keyboard.press("d");
  await expect(
    storyteller.page.getByRole("heading", { name: "Distribute Roles" }),
  ).toBeVisible();
  await storyteller.page.keyboard.press("d");
  await expect(
    storyteller.page.getByRole("heading", { name: "Distribute Roles" }),
  ).toBeHidden();
  await storyteller.page.keyboard.press("p");

  await storyteller.page.keyboard.press("]");
  await expect(
    storyteller.page.getByRole("dialog", {
      name: `${firstSeat.playerName} controls`,
    }),
  ).toBeVisible();

  await storyteller.page.keyboard.press("d");
  await expect(
    storyteller.page
      .getByRole("group", { name: "Life Status" })
      .getByRole("button", { name: "Dead" }),
  ).toHaveAttribute("aria-pressed", "true");

  await storyteller.page.keyboard.press("a");
  await expect(
    storyteller.page
      .getByRole("group", { name: "Alignment" })
      .getByRole("button", { name: "Evil" }),
  ).toHaveAttribute("aria-pressed", "true");

  await storyteller.page.keyboard.press("v");
  await expect(
    storyteller.page
      .getByRole("group", { name: "Ghost Vote" })
      .getByRole("button", { name: "Used" }),
  ).toHaveAttribute("aria-pressed", "true");

  await storyteller.page.keyboard.press("t");
  await expect(
    storyteller.page
      .getByRole("group", { name: "Player Type" })
      .getByRole("button", { name: "Traveller" }),
  ).toHaveAttribute("aria-pressed", "true");

  await storyteller.page.keyboard.press("e");
  const nameInput = storyteller.page.getByRole("textbox", {
    name: `Rename ${firstSeat.playerName}`,
  });
  await expect(nameInput).toBeFocused();
  await nameInput.fill("Ada");
  await storyteller.page.keyboard.press("p");
  await expect(nameInput).toHaveValue("Adap");
  await expect(
    storyteller.page.getByRole("heading", { name: "Players" }),
  ).toHaveCount(0);

  await storyteller.page.keyboard.press("Escape");
  await expect(nameInput).toBeHidden();
  await storyteller.page.keyboard.press("m");
  await expect(
    storyteller.page.getByText("Add Reminder", { exact: true }),
  ).toBeVisible();
  await storyteller.page.keyboard.press("b");
  await expect(
    storyteller.page.getByText("Add Reminder", { exact: true }),
  ).toBeHidden();
  await expect(
    storyteller.page.getByRole("dialog", {
      name: /controls$/,
    }),
  ).toBeVisible();
  await storyteller.page.keyboard.press("Escape");

  await storyteller.page.keyboard.press("]");
  await storyteller.page.keyboard.press("c");
  await expect(
    storyteller.page.getByRole("heading", {
      name: /Choose a Character for/,
    }),
  ).toBeVisible();
  await storyteller.page.keyboard.press("c");
  await expect(
    storyteller.page.getByRole("heading", {
      name: /Choose a Character for/,
    }),
  ).toBeHidden();
});
