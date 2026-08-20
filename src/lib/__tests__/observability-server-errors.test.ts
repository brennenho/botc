import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  captureExceptionImmediate:
    vi.fn<
      (
        error: unknown,
        distinctId?: string,
        properties?: Record<string, unknown>,
      ) => Promise<void>
    >(),
  loggerError: vi.fn(),
  postHogConstructor: vi.fn(),
}));

vi.mock("posthog-node", () => ({
  PostHog: class {
    constructor(...args: unknown[]) {
      mocks.postHogConstructor(...args);
    }

    captureExceptionImmediate = mocks.captureExceptionImmediate;
  },
}));
vi.mock("@/env", () => ({
  env: {
    NEXT_PUBLIC_POSTHOG_HOST: "https://posthog.invalid",
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "test-token",
  },
}));
vi.mock("@/lib/observability/config", () => ({
  observabilityEnabled: true,
}));
vi.mock("@/lib/observability/logger", () => ({
  logger: {
    error: mocks.loggerError,
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

beforeEach(() => {
  vi.resetModules();
  mocks.captureExceptionImmediate.mockReset();
  mocks.loggerError.mockReset();
  mocks.postHogConstructor.mockReset();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "commit-123");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("server exception capture", () => {
  it("creates one actionable exception with a correlated complete log", async () => {
    const cause = Object.assign(new Error("query failed"), {
      code: "PGRST500",
    });
    const error = new Error("unexpected store response", { cause });
    const { captureException } =
      await import("@/lib/observability/server-errors");

    const errorId = await captureException(error, {
      error_id: "error-123",
      path: "/game/ABC234/storyteller",
      source: "test",
    });

    expect(errorId).toBe("error-123");
    expect(mocks.loggerError).toHaveBeenCalledTimes(1);
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "Unexpected application error",
      expect.objectContaining({
        "exception.message": "unexpected store response",
        "exception.type": "Error",
        error_id: "error-123",
        path: "/game/ABC234/storyteller",
        signal: "exception",
      }),
    );
    expect(mocks.captureExceptionImmediate).toHaveBeenCalledWith(
      error,
      undefined,
      expect.objectContaining({
        $process_person_profile: false,
        "deployment.environment": "production",
        "service.version": "commit-123",
        error_id: "error-123",
        path: "/game/ABC234/storyteller",
      }),
    );
    expect(
      mocks.captureExceptionImmediate.mock.calls[0]?.[2]?.["exception.details"],
    ).toEqual(expect.stringContaining("query failed"));
  });

  it("logs delivery failures without creating another exception", async () => {
    mocks.captureExceptionImmediate.mockRejectedValueOnce(
      new Error("PostHog unavailable"),
    );
    const { captureException } =
      await import("@/lib/observability/server-errors");

    await expect(
      captureException(new Error("application failed"), {
        error_id: "error-456",
      }),
    ).resolves.toBe("error-456");

    expect(mocks.captureExceptionImmediate).toHaveBeenCalledTimes(1);
    expect(mocks.loggerError).toHaveBeenCalledTimes(2);
    expect(mocks.loggerError).toHaveBeenLastCalledWith(
      "PostHog exception delivery failed",
      expect.objectContaining({
        "exception.message": "PostHog unavailable",
        component: "observability",
        original_error_id: "error-456",
      }),
    );
  });
});
