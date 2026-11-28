import { describe, expect, it } from "vitest";

import {
  createDefaultNightOrderState,
  normalizeNightOrderState,
} from "@/lib/night-order-state";

describe("night order state", () => {
  it("restores the small-game evil info override only for an explicit true value", () => {
    expect(
      normalizeNightOrderState({ smallGameEvilInfo: true }).smallGameEvilInfo,
    ).toBe(true);
    expect(
      normalizeNightOrderState({ smallGameEvilInfo: "true" }).smallGameEvilInfo,
    ).toBeFalsy();
    expect(normalizeNightOrderState({}).smallGameEvilInfo).toBeFalsy();
  });
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
      completed: { "setup:other:all": ["poisoner", "imp"] },
    });
  });
  it("keeps migrated checkmarks on their original numbered night", () => {
    expect(
      normalizeNightOrderState({
        trackedNight: 2,
        completed: { "other:alive": ["imp"], "1:first:alive": ["dusk"] },
      }).completed,
    ).toEqual({ "2:other:alive": ["imp"], "1:first:alive": ["dusk"] });
  });
});
