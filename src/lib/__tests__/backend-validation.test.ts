import { describe, expect, it } from "vitest";

import {
  joinGameSchema,
  storytellerPatchSchema,
} from "@/lib/server/validation";
import {
  createJoinCode,
  hashToken,
  tokenMatchesHash,
} from "@/lib/server/tokens";

const seat = {
  id: "31ba8fd3-cd2e-4ad9-a415-d2ab3c16b815",
  seatIndex: 0,
  playerName: "Player 1",
  claimedByPlayer: true,
  roleId: "washerwoman",
  alignment: "good" as const,
  alive: true,
  ghostVoteAvailable: true,
  isTraveller: false,
  joinedAt: "2026-08-12T07:00:00+00:00",
};

describe("backend request validation", () => {
  it("normalizes codes and trims player names", () => {
    expect(
      joinGameSchema.parse({
        joinCode: " ab2cd3 ",
        playerName: "  Ada  ",
      }),
    ).toEqual({ joinCode: "AB2CD3", playerName: "Ada" });
  });

  it("rejects whitespace-only player names", () => {
    expect(() =>
      joinGameSchema.parse({ joinCode: "AB2CD3", playerName: "   " }),
    ).toThrow();
  });

  it("requires optimistic versioning and rejects unsupported roles", () => {
    expect(() =>
      storytellerPatchSchema.parse({ code: "AB2CD3", seats: [seat] }),
    ).toThrow();
    expect(() =>
      storytellerPatchSchema.parse({
        code: "AB2CD3",
        expectedVersion: 1,
        seats: [{ ...seat, roleId: "not-a-supported-role" }],
      }),
    ).toThrow();
  });

  it("accepts compatibility seat fields without making them mutable payload fields", () => {
    const result = storytellerPatchSchema.parse({
      code: "AB2CD3",
      expectedVersion: 4,
      seats: [seat],
    });

    expect(result.expectedVersion).toBe(4);
    expect(result.seats?.[0]?.claimedByPlayer).toBe(true);
  });
});

describe("server credentials", () => {
  it("compares credentials against their stored hashes", () => {
    const hash = hashToken("st_secret");

    expect(tokenMatchesHash("st_secret", hash)).toBe(true);
    expect(tokenMatchesHash("st_other", hash)).toBe(false);
    expect(tokenMatchesHash("st_secret", "malformed")).toBe(false);
  });

  it("creates six-character human-readable join codes", () => {
    expect(createJoinCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });
});
