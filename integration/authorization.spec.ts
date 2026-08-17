import type {
  PlayerSnapshot,
  StorytellerSnapshot,
} from "../src/lib/game-data/types";
import {
  createGameViaApi,
  expect,
  getPlayerSnapshot,
  getStorytellerSnapshot,
  joinGameViaApi,
  patchStorytellerViaApi,
  responseJson,
  test,
} from "./fixtures/multiplayer";

test("player snapshots expose only the current player's private state", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const alice = await createActor();
  const bob = await createActor();
  const anonymous = await createActor();
  const created = await createGameViaApi(storyteller);
  const joinCode = created.snapshot.game.joinCode;
  const aliceJoin = await joinGameViaApi(alice, joinCode, "Alice");
  const bobJoin = await joinGameViaApi(bob, joinCode, "Bob");

  const current = await getStorytellerSnapshot(storyteller, joinCode);
  const update = await patchStorytellerViaApi(
    storyteller,
    joinCode,
    current.game.version,
    {
      seats: current.seats.map((seat) => {
        if (seat.id === aliceJoin.seatId)
          return { ...seat, roleId: "chef", alignment: "good" as const };
        if (seat.id === bobJoin.seatId)
          return { ...seat, roleId: "imp", alignment: "evil" as const };
        return seat;
      }),
      gameTokens: [
        {
          id: crypto.randomUUID(),
          seatId: null,
          tokenType: "bluff",
          roleId: "washerwoman",
          label: "Washerwoman",
          position: 0,
          metadata: {},
        },
      ],
    },
  );
  expect(update.status()).toBe(200);

  const { response, snapshot } = await getPlayerSnapshot(
    alice,
    joinCode,
    aliceJoin.seatId,
  );
  expect(response.headers()["cache-control"]).toContain("private, no-store");
  expect(snapshot.seat).toMatchObject({
    id: aliceJoin.seatId,
    playerName: "Alice",
    roleId: "chef",
    alignment: "good",
  });
  expect(snapshot).not.toHaveProperty("gameTokens");

  const bobPublicSeat = snapshot.seats.find(
    (seat) => seat.id === bobJoin.seatId,
  );
  expect(bobPublicSeat).toMatchObject({ playerName: "Bob", occupied: true });
  expect(bobPublicSeat).not.toHaveProperty("roleId");
  expect(bobPublicSeat).not.toHaveProperty("alignment");
  expect(bobPublicSeat).not.toHaveProperty("joinedAt");
  expect(JSON.stringify(snapshot)).not.toContain("imp");
  expect(JSON.stringify(snapshot)).not.toContain("Washerwoman");

  await alice.page.goto(`/game/${joinCode}/player/${aliceJoin.seatId}`);
  const roleCard = alice.page.getByLabel("Your Character");
  await expect(roleCard.getByText("Chef", { exact: true })).toBeVisible();
  await expect(alice.page.getByText("Imp", { exact: true })).toHaveCount(0);

  const anonymousStoryteller = await anonymous.context.request.get(
    `/api/storyteller?code=${joinCode}`,
  );
  expect(anonymousStoryteller.status()).toBe(401);

  const crossSeat = await alice.context.request.get(
    `/api/player?code=${joinCode}&seatId=${bobJoin.seatId}`,
  );
  expect(crossSeat.status()).toBe(401);

  const playerUpdate = await alice.context.request.patch("/api/storyteller", {
    data: {
      code: joinCode,
      expectedVersion: snapshot.game.version,
      phase: "night",
    },
  });
  expect(playerUpdate.status()).toBe(401);

  const unauthorizedBody = await responseJson<{
    error: { code: string };
  }>(playerUpdate);
  expect(unauthorizedBody.error.code).toBe("unauthorized");
});

test("storyteller and player response contracts remain distinct", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const player = await createActor();
  const created = await createGameViaApi(storyteller);
  const joinCode = created.snapshot.game.joinCode;
  const joined = await joinGameViaApi(player, joinCode, "Alice");

  const storytellerResponse = await storyteller.context.request.get(
    `/api/storyteller?code=${joinCode}`,
  );
  const playerResponse = await player.context.request.get(
    `/api/player?code=${joinCode}&seatId=${joined.seatId}`,
  );
  const storytellerBody = await responseJson<{
    snapshot: StorytellerSnapshot;
  }>(storytellerResponse);
  const playerBody = await responseJson<{ snapshot: PlayerSnapshot }>(
    playerResponse,
  );

  expect(storytellerResponse.status()).toBe(200);
  expect(playerResponse.status()).toBe(200);
  expect(storytellerBody.snapshot).toHaveProperty("gameTokens");
  expect(storytellerBody.snapshot.seats[0]).toHaveProperty("roleId");
  expect(playerBody.snapshot).not.toHaveProperty("gameTokens");
  expect(playerBody.snapshot.seats[0]).not.toHaveProperty("roleId");
});
