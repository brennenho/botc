import { describe, expect, it } from "vitest";

import { isValidGameCode, normalizeGameCode } from "@/lib/game-code";

describe("game codes", () => {
  it("normalizes user-entered codes for URLs, cookies, and lookups", () => {
    expect(normalizeGameCode("  gptar2 ")).toBe("GPTAR2");
  });

  it("validates the human-readable game-code alphabet", () => {
    expect(isValidGameCode(" gptar2 ")).toBe(true);
    expect(isValidGameCode("ABC1O0")).toBe(false);
    expect(isValidGameCode("SHORT")).toBe(false);
  });
});
