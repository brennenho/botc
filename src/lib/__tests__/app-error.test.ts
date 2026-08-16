import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchPlayerGame } from "@/lib/api";
import { AppError, isApiErrorPayload, toAppError } from "@/lib/app-error";
import { gameRouteError, rateLimitResponse } from "@/lib/server/route-errors";
import { GameStoreError } from "@/lib/server/errors";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("application errors", () => {
  it("recognizes the structured API error contract", () => {
    expect(
      isApiErrorPayload({
        error: {
          code: "unavailable",
          message: "Service unavailable.",
          retryable: true,
        },
      }),
    ).toBe(true);
    expect(isApiErrorPayload({ error: "Service unavailable." })).toBe(false);
    expect(
      isApiErrorPayload({
        error: { code: "made_up", message: "Unknown", retryable: false },
      }),
    ).toBe(false);
  });

  it("preserves an existing application error", () => {
    const error = new AppError("network", "Offline", { retryable: true });
    expect(toAppError(error)).toBe(error);
  });

  it("maps store errors to the public API contract", async () => {
    const response = gameRouteError(
      new GameStoreError("not_found", "Game not found."),
      "Unable to load game.",
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "not_found",
        message: "Game not found.",
        retryable: false,
      },
    });
  });

  it("includes rate-limit recovery metadata", async () => {
    const response = rateLimitResponse(12);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("12");
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "rate_limited",
        message: "Too many requests. Wait a moment and try again.",
        retryable: true,
      },
    });
  });
});

describe("API request errors", () => {
  it("preserves server error codes and retry timing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "rate_limited",
              message: "Wait before trying again.",
              retryable: true,
            },
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "9",
            },
          },
        ),
      ),
    );

    await expect(fetchPlayerGame("ABC234", "seat-id")).rejects.toMatchObject({
      name: "AppError",
      code: "rate_limited",
      status: 429,
      retryable: true,
      retryAfterSeconds: 9,
    });
  });

  it("normalizes network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(fetchPlayerGame("ABC234", "seat-id")).rejects.toMatchObject({
      name: "AppError",
      code: "network",
      retryable: true,
    });
  });

  it("normalizes malformed responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("not-json", {
          status: 502,
          headers: { "Content-Type": "text/plain" },
        }),
      ),
    );

    await expect(fetchPlayerGame("ABC234", "seat-id")).rejects.toMatchObject({
      name: "AppError",
      code: "invalid_response",
      status: 502,
      retryable: true,
    });
  });
});
