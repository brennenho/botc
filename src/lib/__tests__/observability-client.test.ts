import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const posthog = vi.hoisted(() => ({
  capture: vi.fn(),
  captureException: vi.fn(),
  init: vi.fn(),
}));

vi.mock("posthog-js", () => ({ default: posthog }));
vi.mock("@/env", () => ({
  env: {
    NEXT_PUBLIC_POSTHOG_CAPTURE_IN_DEVELOPMENT: "true",
    NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com",
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "phc_test",
  },
}));

beforeEach(() => {
  vi.resetModules();
  posthog.capture.mockReset();
  posthog.captureException.mockReset();
  posthog.init.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("client observability", () => {
  it("disables reporting when initialization fails", async () => {
    posthog.init.mockImplementationOnce(() => {
      throw new Error("storage unavailable");
    });
    const { initializeClientObservability, trackEvent } =
      await import("@/lib/observability/client");

    expect(() => initializeClientObservability()).not.toThrow();
    expect(() =>
      trackEvent("game_joined", { actor_role: "player" }),
    ).not.toThrow();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("does not let capture failures escape into application code", async () => {
    posthog.capture.mockImplementationOnce(() => {
      throw new Error("capture failed");
    });
    const { initializeClientObservability, trackEvent } =
      await import("@/lib/observability/client");
    initializeClientObservability();

    expect(() =>
      trackEvent("game_joined", { actor_role: "player" }),
    ).not.toThrow();
  });

  it("reports errors through the same fail-open boundary", async () => {
    posthog.captureException.mockImplementationOnce(() => {
      throw new Error("capture failed");
    });
    const { initializeClientObservability, reportError } =
      await import("@/lib/observability/client");
    initializeClientObservability();

    expect(() => reportError(new Error("application failed"))).not.toThrow();
  });
});
