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
    name: "Keyboard Shortcuts",
  });
  const shortcutsHeading = storyteller.page.getByRole("heading", {
    name: "Keyboard Shortcuts",
  });
  await shortcutsButton.click();
  await expect(shortcutsHeading).toBeVisible();
  await storyteller.page.keyboard.press("Escape");
  await expect(shortcutsHeading).toBeHidden();

  await storyteller.page.keyboard.down("Shift");
  await storyteller.page.keyboard.press("/");
  await storyteller.page.keyboard.up("Shift");
  await expect(shortcutsHeading).toBeVisible();
  await storyteller.page.keyboard.press("Escape");
  await expect(shortcutsHeading).toBeHidden();

  await storyteller.page.keyboard.press("p");
  await expect(
    storyteller.page.getByRole("heading", { name: "Players" }),
  ).toBeVisible();
  await storyteller.page.keyboard.press("p");
  await expect(
    storyteller.page.getByRole("heading", { name: "Players" }),
  ).toHaveCount(0);

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
});
