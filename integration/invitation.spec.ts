import {
  createGameFromHome,
  createGameViaApi,
  expect,
  test,
} from "./fixtures/multiplayer";

test("@smoke invitation surfaces fit the viewport", async ({ createActor }) => {
  const storyteller = await createActor({ stubClipboard: true });
  const player = await createActor();
  const created = await createGameViaApi(storyteller);
  const joinCode = created.snapshot.game.joinCode;
  await storyteller.page.goto(`/game/${joinCode}/storyteller`);

  await storyteller.page
    .getByRole("button", { name: `Invite players to game ${joinCode}` })
    .click();

  const dialog = storyteller.page.getByRole("dialog", {
    name: "Invite Players",
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(joinCode, { exact: true })).toBeVisible();
  await expect(
    dialog.getByLabel("QR code for the player invitation link"),
  ).toBeVisible();

  await dialog.getByRole("button", { name: "Copy link" }).click();
  await expect(
    dialog.getByRole("button", { name: "Link copied" }),
  ).toBeVisible();
  await expect(dialog.getByRole("status")).toHaveText("Invitation link copied");

  const layout = await storyteller.page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    dialog: (() => {
      const rect = document
        .querySelector('[role="dialog"]')
        ?.getBoundingClientRect();
      return rect ? { left: rect.left, right: rect.right } : null;
    })(),
  }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.dialog?.left).toBeGreaterThanOrEqual(0);
  expect(layout.dialog?.right).toBeLessThanOrEqual(layout.viewportWidth);

  await player.page.goto(`/join/${joinCode}`);
  await expect(player.page.getByLabel("Game code")).toHaveValue(joinCode);
  await expect(player.page.getByLabel("Your name")).toBeFocused();
  await expect(
    player.page.getByRole("button", { name: "Join game" }),
  ).toBeDisabled();
});

test("invitation link joins a player and updates Storyteller presence", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const player = await createActor();
  const joinCode = await createGameFromHome(storyteller);

  await player.page.goto(`/join/${joinCode}`);
  await player.page.getByLabel("Your name").fill("Invited Player");
  await player.page.getByRole("button", { name: "Join game" }).click();
  await player.page.waitForURL(
    new RegExp(`/game/${joinCode}/player/[^/]+$`, "i"),
  );

  await storyteller.page
    .getByRole("button", {
      name: /Invited Player, Character not assigned\. Open player controls/,
    })
    .waitFor({ state: "visible", timeout: 10_000 });
  await expect(
    storyteller.page.getByRole("status", { name: "Online" }),
  ).toBeVisible();
});

test("edited invitation codes use the ordinary game-not-found message", async ({
  createActor,
}) => {
  const player = await createActor({
    ignoredClientErrors: [/404 \(Not Found\)/i],
  });

  await player.page.goto("/join/ABC234");
  await player.page.getByLabel("Game code").fill("ZZZZZZ");
  await player.page.getByLabel("Your name").fill("Lost Player");
  await player.page.getByRole("button", { name: "Join game" }).click();

  await expect(
    player.page.getByText("Game not found. Check the code and try again."),
  ).toBeVisible();
  await expect(
    player.page.getByText(/invitation may have expired/i),
  ).toHaveCount(0);
});
