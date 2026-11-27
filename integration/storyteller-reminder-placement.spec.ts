import AxeBuilder from "@axe-core/playwright";

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
    exact: true,
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

test("@ipad missing setup reminders place directly from the compact tray", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  await storyteller.page.setViewportSize({ width: 1024, height: 768 });
  const created = await createGameViaApi(storyteller, { playerCount: 7 });
  const snapshot = created.snapshot;
  const joinCode = snapshot.game.joinCode;
  const washerwomanSeat = snapshot.seats[0]!;
  const update = await patchStorytellerViaApi(
    storyteller,
    joinCode,
    snapshot.game.version,
    {
      seats: snapshot.seats.map((seat) =>
        seat.id === washerwomanSeat.id
          ? { ...seat, roleId: "washerwoman", alignment: "good" }
          : seat,
      ),
    },
  );
  expect(update.status()).toBe(200);
  await responseJson<{ snapshot: StorytellerSnapshot }>(update);

  await storyteller.page.goto(`/game/${joinCode}/storyteller`);

  const summary = storyteller.page.getByRole("button", {
    name: "Show 2 missing setup reminders",
  });
  await expect(summary).toBeVisible();
  await expect(summary).toHaveAttribute("aria-expanded", "false");

  const summaryBounds = await summary.boundingBox();
  if (!summaryBounds)
    throw new Error("Missing reminder summary has no bounds.");
  const overlappingPlayers = await storyteller.page
    .locator(".canvas-player-position .player-token")
    .evaluateAll(
      (players, warningBounds) =>
        players.flatMap((player) => {
          const playerBounds = player.getBoundingClientRect();
          const overlaps =
            warningBounds.x < playerBounds.right &&
            warningBounds.x + warningBounds.width > playerBounds.left &&
            warningBounds.y < playerBounds.bottom &&
            warningBounds.y + warningBounds.height > playerBounds.top;
          return overlaps ? [player.getAttribute("aria-label")] : [];
        }),
      summaryBounds,
    );
  expect(overlappingPlayers).toEqual([]);

  await summary.click();

  const townsfolkAction = storyteller.page.getByRole("button", {
    name: "Place Townsfolk reminder from Washerwoman; 1 copy missing",
  });
  await expect(townsfolkAction).toBeVisible();
  const accessibilityResults = await new AxeBuilder({ page: storyteller.page })
    .include(".board-setup-warning")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(accessibilityResults.violations).toEqual([]);
  await townsfolkAction.click();

  const placementDock = storyteller.page.getByRole("region", {
    name: "Place Townsfolk",
  });
  await expect(placementDock).toBeFocused();
  await expect(summary).toHaveAttribute("aria-expanded", "false");
  await expect(townsfolkAction).not.toBeVisible();

  const targetPlayer = storyteller.page
    .locator(".canvas-player-position .player-token")
    .nth(1);
  const targetPlayerLabel = await targetPlayer.getAttribute("aria-label");
  const targetPlayerName = targetPlayerLabel?.split(",", 1)[0];
  if (!targetPlayerName)
    throw new Error("Target player has no accessible name.");
  await targetPlayer.click();

  await expect(
    storyteller.page.getByRole("button", {
      name: `Townsfolk reminder on ${targetPlayerName}`,
    }),
  ).toBeVisible();
  await expect(
    storyteller.page.getByRole("button", {
      name: "Hide 1 missing setup reminder",
    }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(townsfolkAction).toHaveCount(0);

  const wrongAction = storyteller.page.getByRole("button", {
    name: "Place Wrong reminder from Washerwoman; 1 copy missing",
  });
  await wrongAction.click();
  await storyteller.page.keyboard.press("Escape");
  await expect(wrongAction).toBeFocused();
  await expect(
    storyteller.page.locator('[aria-label^="Wrong reminder on"]'),
  ).toHaveCount(0);
});
