import type { StorytellerSnapshot } from "../src/lib/game-data/types";
import {
  createGameViaApi,
  expect,
  getStorytellerSnapshot,
  joinGameViaApi,
  patchStorytellerViaApi,
  responseJson,
  test,
} from "./fixtures/multiplayer";

test("rejoining is idempotent per browser while a new browser claims another seat", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const alice = await createActor();
  const otherBrowser = await createActor();
  const created = await createGameViaApi(storyteller);
  const joinCode = created.snapshot.game.joinCode;

  const firstJoin = await joinGameViaApi(alice, joinCode, "Alice");
  const repeatedJoin = await joinGameViaApi(alice, joinCode, " Alice ");
  expect(repeatedJoin.seatId).toBe(firstJoin.seatId);

  const otherJoin = await joinGameViaApi(otherBrowser, joinCode, "Alice");
  expect(otherJoin.seatId).not.toBe(firstJoin.seatId);

  const snapshot = await getStorytellerSnapshot(storyteller, joinCode);
  expect(snapshot.seats.filter((seat) => seat.claimedByPlayer)).toHaveLength(2);
});

test("a full game rejects another player without changing existing seats", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const created = await createGameViaApi(storyteller, { playerCount: 5 });
  const joinCode = created.snapshot.game.joinCode;
  const players = await Promise.all(
    Array.from({ length: 6 }, () => createActor()),
  );

  for (const [index, player] of players.slice(0, 5).entries()) {
    await joinGameViaApi(player, joinCode, `Player ${index + 1}`);
  }

  const rejected = await players[5]!.context.request.post("/api/join", {
    data: { joinCode, playerName: "Late Player" },
  });
  expect(rejected.status()).toBe(409);
  const body = await responseJson<{ error: { code: string } }>(rejected);
  expect(body.error.code).toBe("no_open_seats");

  const snapshot = await getStorytellerSnapshot(storyteller, joinCode);
  expect(snapshot.seats).toHaveLength(5);
  expect(snapshot.seats.every((seat) => seat.claimedByPlayer)).toBe(true);
  expect(snapshot.seats.some((seat) => seat.playerName === "Late Player")).toBe(
    false,
  );
});

test("simultaneous storyteller updates reject the stale version and preserve the winner", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const created = await createGameViaApi(storyteller);
  const joinCode = created.snapshot.game.joinCode;
  const version = created.snapshot.game.version;

  const [dayResponse, nightResponse] = await Promise.all([
    patchStorytellerViaApi(storyteller, joinCode, version, {
      phase: "day",
      dayNumber: 2,
    }),
    patchStorytellerViaApi(storyteller, joinCode, version, {
      phase: "night",
      dayNumber: 3,
    }),
  ]);
  const responses = [dayResponse, nightResponse];
  const success = responses.find((response) => response.status() === 200);
  const conflict = responses.find((response) => response.status() === 409);
  expect(success).toBeDefined();
  expect(conflict).toBeDefined();

  const successBody = await responseJson<{ snapshot: StorytellerSnapshot }>(
    success!,
  );
  const conflictBody = await responseJson<{ error: { code: string } }>(
    conflict!,
  );
  expect(conflictBody.error.code).toBe("conflict");

  const finalSnapshot = await getStorytellerSnapshot(storyteller, joinCode);
  expect(finalSnapshot.game.version).toBe(version + 1);
  expect(finalSnapshot.game.phase).toBe(successBody.snapshot.game.phase);
  expect(finalSnapshot.game.dayNumber).toBe(
    successBody.snapshot.game.dayNumber,
  );
});
