import { describe, expect, it } from "vitest";

import {
  normalizeLogContext,
  requestLogContext,
} from "@/lib/observability/context";

describe("observability context", () => {
  it("keeps raw request identifiers, paths, and query strings", () => {
    const request = new Request(
      "https://botc.town/game/7KPYGH/player/seat-123?debug=full#state",
      {
        headers: { "x-vercel-id": "iad1::request-123" },
      },
    );

    expect(requestLogContext(request)).toEqual({
      "http.request.method": "GET",
      "url.full":
        "https://botc.town/game/7KPYGH/player/seat-123?debug=full#state",
      "url.path": "/game/7KPYGH/player/seat-123",
      "url.query": "?debug=full",
      "vercel.request_id": "iad1::request-123",
    });
  });

  it("normalizes structured values without dropping their contents", () => {
    expect(
      normalizeLogContext({
        attempt: 2,
        available: false,
        context: { gameCode: "ABC234", seats: ["seat-1", "seat-2"] },
        missing: undefined,
      }),
    ).toEqual({
      attempt: 2,
      available: false,
      context: JSON.stringify({
        gameCode: "ABC234",
        seats: ["seat-1", "seat-2"],
      }),
    });
  });
});
