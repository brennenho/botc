import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const posthog = vi.hoisted(() => ({
  capture: vi.fn(),
  captureException: vi.fn(),
  init: vi.fn(),
}));
const mockEnv = vi.hoisted(() => ({
  NEXT_PUBLIC_DISABLE_OBSERVABILITY: "false",
  NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com",
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "phc_test",
}));

vi.mock("posthog-js", () => ({ default: posthog }));
vi.mock("@/env", () => ({ env: mockEnv }));

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.resetModules();
  posthog.capture.mockReset();
  posthog.captureException.mockReset();
  posthog.init.mockReset();
  mockEnv.NEXT_PUBLIC_DISABLE_OBSERVABILITY = "false";
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("client observability", () => {
  it("honors the explicit observability kill switch", async () => {
    mockEnv.NEXT_PUBLIC_DISABLE_OBSERVABILITY = "true";
    const { initializeClientObservability, trackEvent } =
      await import("@/lib/observability/client");

    initializeClientObservability();
    trackEvent("game_joined", { actor_role: "player" });

    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("keeps observability disabled outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { initializeClientObservability, trackEvent } =
      await import("@/lib/observability/client");

    initializeClientObservability();
    trackEvent("game_joined", { actor_role: "player" });

    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

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
    const { captureException, initializeClientObservability } =
      await import("@/lib/observability/client");
    initializeClientObservability();

    expect(() =>
      captureException(new Error("application failed")),
    ).not.toThrow();
  });

  it("does not duplicate server exceptions from client error boundaries", async () => {
    const { captureBoundaryException, initializeClientObservability } =
      await import("@/lib/observability/client");
    initializeClientObservability();
    const serverError = Object.assign(new Error("server render failed"), {
      digest: "123456",
    });

    captureBoundaryException(serverError, "game");

    expect(posthog.captureException).not.toHaveBeenCalled();
  });

  it("captures client exceptions handled by an error boundary", async () => {
    const { captureBoundaryException, initializeClientObservability } =
      await import("@/lib/observability/client");
    initializeClientObservability();
    const clientError = new Error("client render failed");

    captureBoundaryException(clientError, "application");

    expect(posthog.captureException).toHaveBeenCalledWith(clientError, {
      error_boundary: "application",
    });
  });
});
