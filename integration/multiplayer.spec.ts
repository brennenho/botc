import type { StorytellerSnapshot } from "../src/lib/game-data/types";
import { GAME_INVALIDATION_EVENT } from "../src/lib/game-invalidation";
import {
  createGameFromHome,
  createGameViaApi,
  expect,
  getStorytellerSnapshot,
  joinGameFromHome,
  joinGameViaApi,
  patchStorytellerViaApi,
  responseJson,
  test,
} from "./fixtures/multiplayer";

test("@smoke an uploaded script survives a reload and reaches the joining player's reference sheet", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const player = await createActor();
  const page = storyteller.page;
  await page.goto("/");
  await page.getByRole("button", { name: /^Storyteller/ }).click();
  await page.getByRole("button", { name: "Custom scripts" }).click();
  await page
    .getByLabel("Upload script JSON")
    .setInputFiles("public/assets/scripts/one-in-one-out.json");
  const preview = page.getByRole("dialog", { name: "Script preview" });
  await expect(
    preview.getByRole("heading", { name: "Village Idiot" }),
  ).toBeVisible();
  await preview.getByRole("button", { name: "Close Script preview" }).click();
  await page.getByRole("button", { name: "Open grimoire" }).click();
  await page.waitForURL(/\/game\/[^/]+\/storyteller$/);
  const joinCode = new URL(page.url()).pathname.split("/")[2]!;
  const [realtime] = await Promise.all([
    player.page.waitForEvent(
      "websocket",
      (socket) => new URL(socket.url()).pathname === "/realtime/v1/websocket",
    ),
    joinGameFromHome(player, joinCode, "Alice"),
  ]);
  await page
    .getByRole("button", {
      name: "Alice, Character not assigned. Open player controls",
    })
    .click();
  await page
    .getByRole("button", { name: "Assign a Character to Alice" })
    .click();
  await Promise.all([
    realtime.waitForEvent("framereceived", {
      predicate: ({ payload }) =>
        payload.toString().includes(GAME_INVALIDATION_EVENT),
      timeout: 10_000,
    }),
    page.getByRole("button", { name: "Village Idiot", exact: true }).click(),
  ]);
  await expect(
    player.page
      .getByLabel("Your Character")
      .getByText("Village Idiot", { exact: true }),
  ).toBeVisible({ timeout: 10_000 });
  await page.reload();
  await expect(page.getByText("One In One Out", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Alice, Village Idiot. Open player controls",
    }),
  ).toBeVisible();
  await player.page
    .getByRole("button", { name: "Reference", exact: true })
    .click();
  const reference = player.page.getByRole("tabpanel", { name: "Script" });
  await expect(
    reference.getByRole("heading", { name: "One In One Out" }),
  ).toBeVisible();
  await expect(
    reference.getByRole("heading", { name: "Village Idiot" }),
  ).toBeVisible();
  await expect(
    reference.getByRole("heading", { name: "Jinxes" }),
  ).toBeVisible();
});

test("storyteller changes reach a connected player in realtime", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const player = await createActor();
  const joinCode = await createGameFromHome(storyteller);
  await joinGameFromHome(player, joinCode, "Alice");

  const aliceUnassigned = storyteller.page.getByRole("button", {
    name: "Alice, Character not assigned. Open player controls",
  });
  await expect(aliceUnassigned).toBeVisible({ timeout: 10_000 });
  await expect(
    player.page.getByLabel("Your Character").getByText("Not Assigned"),
  ).toBeVisible();

  await aliceUnassigned.click();
  await storyteller.page
    .getByRole("button", { name: "Assign a Character to Alice" })
    .click();
  await expect(
    storyteller.page.getByRole("heading", {
      name: "Choose a Character for Alice",
    }),
  ).toBeVisible();
  await storyteller.page
    .getByRole("button", { name: "Chef", exact: true })
    .click();

  const roleCard = player.page.getByLabel("Your Character");
  await expect(roleCard.getByText("Chef", { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await expect(roleCard.getByText("Townsfolk · Good")).toBeVisible();

  await storyteller.page
    .getByRole("button", {
      name: "Alice, Chef. Open player controls",
    })
    .click();
  const lifeStatus = storyteller.page.getByRole("group", {
    name: "Life Status",
  });
  await lifeStatus.getByRole("button", { name: "Dead" }).click();
  await expect(roleCard.getByText("Dead", { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await expect(roleCard.getByText("Vote Available")).toBeVisible();

  const ghostVote = storyteller.page.getByRole("group", {
    name: "Ghost Vote",
  });
  await ghostVote.getByRole("button", { name: "Used" }).click();
  await expect(roleCard.getByText("Vote Used")).toBeVisible({
    timeout: 10_000,
  });
});

test("focus reconciliation recovers an update missed while realtime is unavailable", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const player = await createActor({
    ignoredClientErrors: [/websocket/i, /realtime/i],
  });
  const created = await createGameViaApi(storyteller);
  const joinCode = created.snapshot.game.joinCode;
  const joined = await joinGameViaApi(player, joinCode, "Alice");

  await player.page.routeWebSocket(/\/realtime\/v1\/websocket/i, async (ws) => {
    await ws.close({ code: 1000, reason: "Integration test missed event" });
  });
  await player.page.goto(`/game/${joinCode}/player/${joined.seatId}`);
  const roleCard = player.page.getByLabel("Your Character");
  await expect(roleCard.getByText("Not Assigned")).toBeVisible();

  const current = await getStorytellerSnapshot(storyteller, joinCode);
  const response = await patchStorytellerViaApi(
    storyteller,
    joinCode,
    current.game.version,
    {
      seats: current.seats.map((seat) =>
        seat.id === joined.seatId
          ? { ...seat, roleId: "chef", alignment: "good" }
          : seat,
      ),
    },
  );
  expect(response.status()).toBe(200);
  await responseJson<{ snapshot: StorytellerSnapshot }>(response);

  const refresh = player.page.waitForResponse(
    (candidate) =>
      candidate.url().includes("/api/player?") && candidate.status() === 200,
  );
  await player.page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await refresh;
  await expect(roleCard.getByText("Chef", { exact: true })).toBeVisible();
});
