import {
  createGameViaApi,
  expect,
  joinGameViaApi,
  test,
} from "./fixtures/multiplayer";

test("a direct invitation keeps its game code fixed and joins on mobile", async ({
  createActor,
}) => {
  const player = await createActor({ viewport: { width: 390, height: 844 } });
  const created = await createGameViaApi(player);
  const joinCode = created.snapshot.game.joinCode;

  await player.page.goto(`/join/${joinCode}`);

  await expect(
    player.page.getByRole("heading", { name: "You’re invited" }),
  ).toBeVisible();
  await expect(player.page.getByLabel(`Game code ${joinCode}`)).toBeVisible();
  await expect(
    player.page.getByRole("textbox", { name: "Game code" }),
  ).toHaveCount(0);
  await expect(player.page.getByLabel("Your name")).toBeFocused();
  expect(
    await player.page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await player.page.getByLabel("Your name").fill("Alice");
  await player.page.getByRole("button", { name: "Join game" }).click();
  await player.page.waitForURL(
    new RegExp(`/game/${joinCode}/player/[^/]+$`, "i"),
  );
});

test("an invitation can switch to manual entry without stale invitation errors", async ({
  createActor,
}) => {
  const player = await createActor({
    ignoredClientErrors: [/server responded with a status of 404/i],
  });
  const created = await createGameViaApi(player);

  await player.page.goto(`/join/${created.snapshot.game.joinCode}`);
  await player.page.getByLabel("Your name").fill("Alice");
  await player.page
    .getByRole("button", { name: "Use a different code" })
    .click();

  const codeInput = player.page.getByRole("textbox", { name: "Game code" });
  await expect(
    player.page.getByRole("heading", { name: "Join a game" }),
  ).toBeVisible();
  await expect(codeInput).toBeFocused();
  await expect(player.page.getByLabel("Your name")).toHaveValue("Alice");

  await player.page.route("**/api/join", async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "not_found",
          message: "Game not found.",
          retryable: false,
        },
      }),
    });
  });
  await codeInput.fill("AAAAAA");
  await player.page.getByRole("button", { name: "Join game" }).click();

  await expect(
    player.page.getByText("Game not found. Check the code and try again."),
  ).toBeVisible();
  await expect(
    player.page.getByText(/invitation may have expired/i),
  ).toHaveCount(0);
});

test("an invalid invitation recovers inside the shared entry experience", async ({
  createActor,
}) => {
  const player = await createActor({
    ignoredClientErrors: [/server responded with a status of 404/i],
  });

  await player.page.goto("/join/invalid");

  await expect(player.page.locator(".entry-book")).toBeVisible();
  await expect(
    player.page.getByRole("heading", { name: "Invitation unavailable" }),
  ).toBeVisible();
  await player.page.getByRole("button", { name: "Enter a game code" }).click();
  await expect(
    player.page.getByRole("heading", { name: "Join a game" }),
  ).toBeVisible();
  await expect(
    player.page.getByRole("textbox", { name: "Game code" }),
  ).toBeFocused();
});

test("a full game gives an invitation-specific recovery state", async ({
  createActor,
}) => {
  const player = await createActor({
    ignoredClientErrors: [/server responded with a status of 409/i],
  });
  const created = await createGameViaApi(player, { playerCount: 5 });
  const joinCode = created.snapshot.game.joinCode;

  for (let index = 1; index <= 5; index += 1) {
    await joinGameViaApi(player, joinCode, `Player ${index}`);
  }

  await player.page.goto(`/join/${joinCode}`);
  await player.page.getByLabel("Your name").fill("Late player");
  await player.page.getByRole("button", { name: "Join game" }).click();

  await expect(
    player.page.getByRole("heading", { name: "Game is full" }),
  ).toBeVisible();
  await expect(
    player.page.getByText(
      "This game has no open seats. Ask your storyteller before trying again.",
    ),
  ).toBeVisible();
  await expect(
    player.page.getByRole("button", { name: "Enter another code" }),
  ).toBeVisible();
});
