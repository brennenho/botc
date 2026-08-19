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

test("API validation rejects malformed create, join, and update payloads", async ({
  createActor,
}) => {
  const storyteller = await createActor();

  for (const data of [
    { edition: "homebrew", playerCount: 7 },
    { edition: "tb", playerCount: 4 },
    { edition: "tb", playerCount: 21 },
  ]) {
    const response = await storyteller.context.request.post("/api/games", {
      data,
    });
    expect(response.status()).toBe(400);
    expect(
      (await responseJson<{ error: { code: string } }>(response)).error.code,
    ).toBe("invalid_input");
  }

  const unknownJoin = await storyteller.context.request.post("/api/join", {
    data: { joinCode: "ZZZZZZ", playerName: "Alice" },
  });
  expect(unknownJoin.status()).toBe(404);

  const emptyName = await storyteller.context.request.post("/api/join", {
    data: { joinCode: "ABC234", playerName: "   " },
  });
  expect(emptyName.status()).toBe(400);

  const created = await createGameViaApi(storyteller);
  const current = await getStorytellerSnapshot(
    storyteller,
    created.snapshot.game.joinCode,
  );
  const invalidRole = await patchStorytellerViaApi(
    storyteller,
    current.game.joinCode,
    current.game.version,
    {
      seats: current.seats.map((seat, index) =>
        index === 0 ? { ...seat, roleId: "not-a-character" } : seat,
      ),
    },
  );
  expect(invalidRole.status()).toBe(400);
  expect(
    (await responseJson<{ error: { code: string } }>(invalidRole)).error.code,
  ).toBe("invalid_input");
});

test("simultaneous joins cannot claim the same final seat", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const created = await createGameViaApi(storyteller, { playerCount: 5 });
  const joinCode = created.snapshot.game.joinCode;
  const actors = await Promise.all(
    Array.from({ length: 6 }, () => createActor()),
  );

  for (const [index, actor] of actors.slice(0, 4).entries()) {
    await joinGameViaApi(actor, joinCode, `Player ${index + 1}`);
  }

  const contenders = await Promise.all(
    actors.slice(4).map((actor, index) =>
      actor.context.request.post("/api/join", {
        data: { joinCode, playerName: `Contender ${index + 1}` },
      }),
    ),
  );
  expect(contenders.map((response) => response.status()).sort()).toEqual([
    200, 409,
  ]);

  const snapshot = await getStorytellerSnapshot(storyteller, joinCode);
  expect(snapshot.seats.filter((seat) => seat.claimedByPlayer)).toHaveLength(5);
  expect(new Set(snapshot.seats.map((seat) => seat.id)).size).toBe(5);
});

test("create-game rate limiting returns retry metadata", async ({
  createActor,
}) => {
  const clientId = `integration-${crypto.randomUUID()}`;
  const actor = await createActor({ clientId });
  const responses = [];

  for (let index = 0; index < 13; index += 1) {
    responses.push(
      await actor.context.request.post("/api/games", {
        data: {},
      }),
    );
  }

  expect(
    responses.slice(0, 12).every((response) => response.status() === 400),
  ).toBe(true);
  const limited = responses[12]!;
  expect(limited.status()).toBe(429);
  expect(Number(limited.headers()["retry-after"])).toBeGreaterThan(0);
  expect(
    (await responseJson<{ error: { code: string } }>(limited)).error.code,
  ).toBe("rate_limited");
});

test("credential cookies are private and scoped to the application", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const created = await storyteller.context.request.post("/api/games", {
    data: { edition: "tb", playerCount: 5 },
  });
  const body = await responseJson<{ snapshot: StorytellerSnapshot }>(created);
  const cookie = created.headers()["set-cookie"] ?? "";

  expect(cookie).toContain(`botc_st_${body.snapshot.game.joinCode}=`);
  expect(cookie.toLowerCase()).toContain("httponly");
  expect(cookie.toLowerCase()).toContain("samesite=lax");
  expect(cookie).toContain("Path=/");
  expect(cookie).toMatch(/Max-Age=604800/i);
});
