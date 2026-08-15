import { describe, expect, it } from "vitest";

import { takeRateLimit, takeRequestRateLimit } from "@/lib/server/rate-limit";

describe("server rate limiting", () => {
  it("blocks a client after the configured fixed-window limit", () => {
    const options = { limit: 2, windowMs: 1_000 };

    expect(takeRateLimit("test:fixed-window", options, 1_000).allowed).toBe(
      true,
    );
    expect(takeRateLimit("test:fixed-window", options, 1_100).allowed).toBe(
      true,
    );
    expect(takeRateLimit("test:fixed-window", options, 1_200)).toEqual({
      allowed: false,
      retryAfterSeconds: 1,
    });
    expect(takeRateLimit("test:fixed-window", options, 2_001).allowed).toBe(
      true,
    );
  });

  it("separates forwarded clients within the same route namespace", () => {
    const options = { limit: 1, windowMs: 10_000 };
    const first = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
    });
    const second = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.11, 10.0.0.1" },
    });

    expect(
      takeRequestRateLimit(first, "test:clients", options, 5_000).allowed,
    ).toBe(true);
    expect(
      takeRequestRateLimit(first, "test:clients", options, 5_100).allowed,
    ).toBe(false);
    expect(
      takeRequestRateLimit(second, "test:clients", options, 5_100).allowed,
    ).toBe(true);
  });
});
