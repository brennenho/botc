import type { StorytellerSnapshot } from "../src/lib/game-data/types";
import {
  createGameViaApi,
  expect,
  patchStorytellerViaApi,
  responseJson,
  test,
} from "./fixtures/multiplayer";

test("@ipad reminder placement yields the full board and restores Night Order", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const created = await createGameViaApi(storyteller, { playerCount: 7 });
  const snapshot = created.snapshot;
  const joinCode = snapshot.game.joinCode;
  const poisonerSeat = snapshot.seats[0]!;
  const update = await patchStorytellerViaApi(
    storyteller,
    joinCode,
    snapshot.game.version,
    {
      seats: snapshot.seats.map((seat) =>
        seat.id === poisonerSeat.id
          ? { ...seat, roleId: "poisoner", alignment: "evil" }
          : seat,
      ),
    },
  );
  expect(update.status()).toBe(200);
  await responseJson<{ snapshot: StorytellerSnapshot }>(update);

  await storyteller.page.goto(`/game/${joinCode}/storyteller`);
  const nightTab = storyteller.page.getByRole("button", {
    name: "Night Order",
  });
  await nightTab.click();

  const sideSheet = storyteller.page.locator(".side-sheet.night-sheet");
  const nightOrder = storyteller.page.getByRole("dialog", {
    name: "Night Order",
  });
  await expect(nightOrder).toBeVisible();
  await nightOrder.getByRole("button", { name: "All" }).click();

  const reminderAction = nightOrder.getByRole("button", {
    name: /^Place Poisoned on the chosen player\./,
  });
  const nightOrderList = nightOrder.locator(".night-order-list");
  await reminderAction.evaluate((button) => {
    const list = button.closest(".night-order-list");
    const row = button.closest(".night-order-row");
    if (!list || !row) return;
    list.scrollTop = Math.max(
      1,
      Math.min(
        list.scrollTop +
          row.getBoundingClientRect().top -
          list.getBoundingClientRect().top -
          80,
        list.scrollHeight - list.clientHeight,
      ),
    );
  });
  const scrollTopBeforePlacement = await nightOrderList.evaluate(
    (list) => list.scrollTop,
  );
  expect(scrollTopBeforePlacement).toBeGreaterThan(0);

  const playerTokens = storyteller.page.locator(
    ".canvas-player-position .player-token",
  );
  const rightmostPlayer = await playerTokens.evaluateAll(
    (tokens) =>
      tokens
        .map((token, index) => {
          const bounds = token.getBoundingClientRect();
          return {
            index,
            center: bounds.left + bounds.width / 2,
            label: token.getAttribute("aria-label") ?? "",
          };
        })
        .sort((first, second) => second.center - first.center)[0],
  );
  if (!rightmostPlayer) throw new Error("No player token was rendered.");

  const sheetBoundsBeforePlacement = await sideSheet.boundingBox();
  expect(sheetBoundsBeforePlacement).not.toBeNull();
  expect(rightmostPlayer.center).toBeGreaterThan(sheetBoundsBeforePlacement!.x);

  await reminderAction.click();

  const placementDock = storyteller.page.getByRole("region", {
    name: "Place Poisoned",
  });
  await expect(placementDock).toBeFocused();
  await expect(sideSheet).toHaveAttribute("data-suspended", "");
  await expect(sideSheet).toHaveAttribute("inert", "");
  await expect(sideSheet).toHaveAttribute("aria-hidden", "true");
  await expect(nightTab).toHaveAttribute("aria-pressed", "true");
  await expect(
    storyteller.page.locator(".grimoire-panel-tabs"),
  ).not.toHaveClass(/is-sheet-open/);
  await expect
    .poll(async () => (await sideSheet.boundingBox())?.x ?? 0)
    .toBeGreaterThanOrEqual(1024);

  const targetPlayer = playerTokens.nth(rightmostPlayer.index);
  const targetPlayerName = rightmostPlayer.label.split(",", 1)[0]!;
  await targetPlayer.click();

  await expect(sideSheet).not.toHaveAttribute("data-suspended", "");
  await expect(nightOrder).toBeVisible();
  await expect(reminderAction).toBeFocused();
  await expect
    .poll(() => nightOrderList.evaluate((list) => list.scrollTop))
    .toBe(scrollTopBeforePlacement);
  await expect(
    storyteller.page.getByRole("button", {
      name: `Poisoned reminder on ${targetPlayerName}`,
    }),
  ).toBeVisible();

  const reminderCount = await storyteller.page
    .locator('[aria-label^="Poisoned reminder on"]')
    .count();

  await reminderAction.click();
  await storyteller.page
    .getByRole("button", { name: "Cancel Reminder Placement" })
    .click();
  await expect(sideSheet).not.toHaveAttribute("data-suspended", "");
  await expect(reminderAction).toBeFocused();
  await expect(
    storyteller.page.locator('[aria-label^="Poisoned reminder on"]'),
  ).toHaveCount(reminderCount);

  await reminderAction.click();
  await storyteller.page.keyboard.press("Escape");
  await expect(sideSheet).not.toHaveAttribute("data-suspended", "");
  await expect(reminderAction).toBeFocused();

  await reminderAction.click();
  await nightTab.click();
  await expect(nightOrder).toBeVisible();
  await expect(nightTab).toHaveAttribute("aria-pressed", "true");
  await expect(reminderAction).toBeFocused();

  await sideSheet.getByRole("button", { name: "Pin Sheet" }).click();
  await reminderAction.click();
  await expect(sideSheet).not.toHaveAttribute("data-suspended", "");
  await expect(nightOrder).toBeVisible();
  await expect(placementDock).toHaveClass(/is-sheet-adjacent/);
  await storyteller.page
    .getByRole("button", { name: "Cancel Reminder Placement" })
    .click();
  await expect(reminderAction).toBeFocused();
});
