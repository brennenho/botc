import { describe, expect, it } from "vitest";

import {
  createDefaultNightOrderState,
  normalizeNightOrderState,
} from "@/lib/night-order-state";

describe("night order state", () => {
  it("creates the default night-order controls", () => {
    expect(createDefaultNightOrderState()).toEqual({
      night: "first",
      scope: "alive",
      completed: {},
    });
  });

  it("normalizes persisted filters and completed entries", () => {
    expect(
      normalizeNightOrderState({
        night: "other",
        scope: "all",
        completed: {
          "other:all": ["poisoner", "poisoner", "imp"],
          invalid: ["ignored"],
        },
      }),
    ).toEqual({
      night: "other",
      scope: "all",
      completed: { "other:all": ["poisoner", "imp"] },
    });
  });
});
