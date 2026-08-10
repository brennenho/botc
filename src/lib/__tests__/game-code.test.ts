import { describe, expect, it } from "vitest";

import { normalizeGameCode } from "@/lib/game-code";

describe("game codes", () => {
  it("normalizes user-entered codes for URLs, cookies, and lookups", () => {
    expect(normalizeGameCode("  gptar2 ")).toBe("GPTAR2");
  });
});
