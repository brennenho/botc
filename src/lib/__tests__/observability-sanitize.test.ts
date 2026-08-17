import { describe, expect, it } from "vitest";

import {
  sanitizeEvent,
  sanitizePath,
  sanitizeUrl,
} from "@/lib/observability/sanitize";

describe("observability privacy sanitization", () => {
  it("removes game and seat identifiers from dynamic paths", () => {
    expect(sanitizePath("/game/7KPYGH/storyteller")).toBe(
      "/game/[code]/storyteller",
    );
    expect(
      sanitizePath("/game/7KPYGH/player/6ee6b850-5747-4637-97f8-7adf47c3a913"),
    ).toBe("/game/[code]/player/[seatId]");
  });

  it("keeps public routes intact", () => {
    expect(sanitizePath("/privacy")).toBe("/privacy");
    expect(sanitizePath("/tb")).toBe("/tb");
  });

  it("removes query strings and fragments from URLs", () => {
    expect(
      sanitizeUrl(
        "https://example.com/game/7KPYGH/storyteller?token=secret#private",
      ),
    ).toBe("https://example.com/game/[code]/storyteller");
    expect(sanitizeUrl("/privacy?source=footer#questions")).toBe("/privacy");
  });

  it("sanitizes every URL property without mutating the input", () => {
    const event = {
      event: "$pageview",
      properties: {
        $current_url: "https://example.com/game/ABC234/storyteller",
        $pathname: "/game/ABC234/storyteller",
        edition: "tb",
      },
    };

    const sanitized = sanitizeEvent(event);

    expect(sanitized.properties).toEqual({
      $current_url: "https://example.com/game/[code]/storyteller",
      $pathname: "/game/[code]/storyteller",
      edition: "tb",
    });
    expect(event.properties.$pathname).toBe("/game/ABC234/storyteller");
  });
});
