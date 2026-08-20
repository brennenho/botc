import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as NextServer from "next/server";

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  callbacks: [] as Array<() => unknown>,
  captureException: vi.fn(),
  loggerError: vi.fn(),
  loggerInfo: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("next/server", async (importOriginal) => {
  const original = await importOriginal<typeof NextServer>();
  return { ...original, after: mocks.after };
});
vi.mock("@/lib/observability/logger", () => ({
  logger: {
    error: mocks.loggerError,
    info: mocks.loggerInfo,
    warn: mocks.loggerWarn,
  },
}));
vi.mock("@/lib/observability/server-errors", () => ({
  captureException: mocks.captureException,
}));

import { gameRouteError } from "@/lib/server/route-errors";
import { databaseError, GameStoreError } from "@/lib/server/errors";

const routeContext = {
  operation: "create_game",
  request: new Request("https://botc.town/api/games?source=home", {
    method: "POST",
    headers: { "x-vercel-id": "iad1::request-123" },
  }),
};

beforeEach(() => {
  mocks.callbacks.length = 0;
  mocks.after.mockReset();
  mocks.after.mockImplementation((callback: () => unknown) => {
    mocks.callbacks.push(callback);
  });
  mocks.captureException.mockReset();
  mocks.loggerError.mockReset();
  mocks.loggerInfo.mockReset();
  mocks.loggerWarn.mockReset();
});

describe("game route error observability", () => {
  it("marks unknown database failures for developer attention", () => {
    const cause = { code: "PGRST500", message: "connection refused" };
    const error = databaseError(cause, "Unable to load game.");

    expect(error).toMatchObject({
      code: "unavailable",
      message: "Unable to load game.",
      needsDeveloperAttention: true,
    });
    expect(error.cause).toBe(cause);
  });

  it("keeps known domain failures in the expected log-only path", () => {
    const cause = { message: "BOTC_GAME_NOT_FOUND" };
    const error = databaseError(cause);

    expect(error).toMatchObject({
      code: "not_found",
      needsDeveloperAttention: false,
    });
    expect(error.cause).toBe(cause);
  });

  it("logs expected application errors without capturing exceptions", async () => {
    const error = new GameStoreError("not_found", "Game not found.");

    const response = gameRouteError(
      error,
      "Unable to create game.",
      routeContext,
    );

    expect(response.status).toBe(404);
    expect(mocks.loggerInfo).toHaveBeenCalledWith(
      "Game API request completed with an expected error",
      expect.objectContaining({
        "exception.message": "Game not found.",
        "http.response.status_code": 404,
        "url.full": "https://botc.town/api/games?source=home",
        app_error_code: "not_found",
        operation: "create_game",
        outcome: "expected_error",
      }),
    );
    expect(mocks.after).not.toHaveBeenCalled();
    expect(mocks.captureException).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "not_found",
        message: "Game not found.",
        retryable: false,
      },
    });
  });

  it("captures storage contract failures that need developer attention", async () => {
    const cause = new Error("RPC returned no result");
    const error = new GameStoreError("unavailable", "Unable to create game.", {
      cause,
      needsDeveloperAttention: true,
    });

    const response = gameRouteError(
      error,
      "Unable to create game.",
      routeContext,
    );
    const body = (await response.json()) as {
      error: { code: string; id: string };
    };

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("unavailable");
    expect(body.error.id).toEqual(expect.any(String));
    expect(mocks.loggerError).not.toHaveBeenCalled();
    expect(mocks.after).toHaveBeenCalledTimes(1);

    await mocks.callbacks[0]?.();

    expect(mocks.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        "http.response.status_code": 503,
        app_error_code: "unavailable",
        error_id: body.error.id,
        operation: "create_game",
      }),
    );
  });

  it("captures unknown failures instead of classifying them as expected", async () => {
    const error = new TypeError("Cannot read properties of undefined");

    const response = gameRouteError(
      error,
      "Unable to create game.",
      routeContext,
    );
    const body = (await response.json()) as {
      error: { code: string; id: string };
    };

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("unknown");
    expect(body.error.id).toEqual(expect.any(String));

    await mocks.callbacks[0]?.();

    expect(mocks.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        app_error_code: "unknown",
        error_id: body.error.id,
      }),
    );
  });
});
