import {
  expect,
  test as base,
  type APIResponse,
  type BrowserContext,
  type Page,
  type ViewportSize,
} from "@playwright/test";

import type {
  EditionId,
  PlayerSnapshot,
  StorytellerPatch,
  StorytellerSnapshot,
} from "../../src/lib/game-data/types";

export type Actor = {
  context: BrowserContext;
  page: Page;
};

type ActorOptions = {
  clientId?: string;
  ignoredClientErrors?: RegExp[];
  stubClipboard?: boolean;
  viewport?: ViewportSize;
};

type ActorFactory = (options?: ActorOptions) => Promise<Actor>;

type MultiplayerFixtures = {
  createActor: ActorFactory;
};

export const test = base.extend<MultiplayerFixtures>({
  createActor: async ({ baseURL, browser, contextOptions }, provide) => {
    const contexts: BrowserContext[] = [];
    const unexpectedClientErrors: string[] = [];

    const createActor: ActorFactory = async (options = {}) => {
      const context = await browser.newContext({
        ...contextOptions,
        baseURL,
        extraHTTPHeaders: {
          ...contextOptions.extraHTTPHeaders,
          "x-real-ip": options.clientId ?? `integration-${crypto.randomUUID()}`,
        },
        viewport: options.viewport ?? contextOptions.viewport,
      });
      if (options.stubClipboard) {
        await context.addInitScript(() => {
          Object.defineProperty(Navigator.prototype, "clipboard", {
            configurable: true,
            get: () => ({ writeText: async () => undefined }),
          });
        });
      }
      const page = await context.newPage();
      contexts.push(context);

      page.on("console", (message) => {
        if (message.type() !== "error") return;
        const text = message.text();
        if (options.ignoredClientErrors?.some((pattern) => pattern.test(text)))
          return;
        unexpectedClientErrors.push(`console: ${text}`);
      });
      page.on("pageerror", (error) => {
        const text = error.stack ?? error.message;
        if (options.ignoredClientErrors?.some((pattern) => pattern.test(text)))
          return;
        unexpectedClientErrors.push(`page: ${text}`);
      });

      return { context, page };
    };

    await provide(createActor);

    await Promise.all(contexts.map((context) => context.close()));
    expect
      .soft(unexpectedClientErrors, "unexpected browser errors")
      .toEqual([]);
  },
});

export { expect } from "@playwright/test";

export async function createGameFromHome(
  actor: Actor,
  options: { edition?: EditionId; playerCount?: number } = {},
) {
  const { edition = "tb", playerCount = 5 } = options;
  await actor.page.goto("/");
  await actor.page.getByRole("button", { name: /^Storyteller/ }).click();

  if (edition !== "tb") {
    const editionName =
      edition === "bmr" ? "Bad Moon Rising" : "Sects & Violets";
    await actor.page
      .getByRole("button", { name: new RegExp(`^${editionName}`) })
      .click();
  }

  await actor.page.getByLabel("Player Count").fill(String(playerCount));
  await actor.page.getByRole("button", { name: "Open grimoire" }).click();
  await actor.page.waitForURL(/\/game\/[A-HJ-NP-Z2-9]{6}\/storyteller$/);

  const match = /\/game\/([A-HJ-NP-Z2-9]{6})\/storyteller$/.exec(
    new URL(actor.page.url()).pathname,
  );
  if (!match?.[1]) throw new Error("Unable to read the created game code.");
  return match[1];
}

export async function joinGameFromHome(
  actor: Actor,
  joinCode: string,
  playerName: string,
) {
  await actor.page.goto("/");
  await actor.page.getByRole("button", { name: /^Player/ }).click();
  await actor.page.getByLabel("Game code").fill(joinCode);
  await actor.page.getByLabel("Your name").fill(playerName);
  await actor.page.getByRole("button", { name: "Join game" }).click();
  await actor.page.waitForURL(
    new RegExp(`/game/${joinCode}/player/[^/]+$`, "i"),
  );

  const match = new RegExp(`/game/${joinCode}/player/([^/]+)$`, "i").exec(
    new URL(actor.page.url()).pathname,
  );
  if (!match?.[1]) throw new Error("Unable to read the joined player seat.");
  return match[1];
}

export async function createGameViaApi(
  actor: Actor,
  options: { edition?: EditionId; playerCount?: number } = {},
) {
  const response = await actor.context.request.post("/api/games", {
    data: {
      edition: options.edition ?? "tb",
      playerCount: options.playerCount ?? 5,
    },
  });
  expect(response.status()).toBe(200);
  const setCookie = response.headers()["set-cookie"];
  const cookiePair = setCookie?.split(";", 1)[0];
  const separator = cookiePair?.indexOf("=") ?? -1;
  if (cookiePair && separator > 0) {
    await actor.context.addCookies([
      {
        name: cookiePair.slice(0, separator),
        value: cookiePair.slice(separator + 1),
        url: new URL(response.url()).origin,
        httpOnly: true,
        sameSite: "Lax",
        secure: false,
      },
    ]);
  }
  return responseJson<{ snapshot: StorytellerSnapshot }>(response);
}

export async function joinGameViaApi(
  actor: Actor,
  joinCode: string,
  playerName: string,
) {
  const response = await actor.context.request.post("/api/join", {
    data: { joinCode, playerName },
  });
  expect(response.status()).toBe(200);
  return responseJson<{ seatId: string; snapshot: PlayerSnapshot }>(response);
}

export async function getStorytellerSnapshot(actor: Actor, joinCode: string) {
  const response = await actor.context.request.get(
    `/api/storyteller?code=${encodeURIComponent(joinCode)}`,
  );
  expect(response.status()).toBe(200);
  const body = await responseJson<{ snapshot: StorytellerSnapshot }>(response);
  return body.snapshot;
}

export async function getPlayerSnapshot(
  actor: Actor,
  joinCode: string,
  seatId: string,
) {
  const response = await actor.context.request.get(
    `/api/player?code=${encodeURIComponent(joinCode)}&seatId=${encodeURIComponent(seatId)}`,
  );
  expect(response.status()).toBe(200);
  const body = await responseJson<{ snapshot: PlayerSnapshot }>(response);
  return { response, snapshot: body.snapshot };
}

export async function patchStorytellerViaApi(
  actor: Actor,
  joinCode: string,
  expectedVersion: number,
  patch: StorytellerPatch,
) {
  return actor.context.request.patch("/api/storyteller", {
    data: { code: joinCode, expectedVersion, ...patch },
  });
}

export async function responseJson<T>(response: APIResponse): Promise<T> {
  const body: unknown = await response.json();
  return body as T;
}
