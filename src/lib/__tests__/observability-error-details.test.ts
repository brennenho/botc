import { describe, expect, it } from "vitest";

import {
  errorLogContext,
  serializeError,
} from "@/lib/observability/error-details";

describe("observability error details", () => {
  it("preserves complete errors and their causes", () => {
    const cause = Object.assign(new Error("database connection failed"), {
      code: "PGRST000",
      details: "connection refused",
    });
    const error = Object.assign(new Error("Unable to create game", { cause }), {
      digest: "2262608298",
      status: 503,
    });

    expect(serializeError(error)).toMatchObject({
      name: "Error",
      message: "Unable to create game",
      digest: "2262608298",
      status: 503,
      cause: {
        name: "Error",
        message: "database connection failed",
        code: "PGRST000",
        details: "connection refused",
      },
    });
    const context = errorLogContext(error);
    expect(context).toMatchObject({
      "exception.digest": "2262608298",
      "exception.message": "Unable to create game",
      "exception.status": 503,
      "exception.type": "Error",
    });
    expect(context["exception.details"]).toEqual(
      expect.stringContaining("database connection failed"),
    );
  });

  it("handles non-Error values and circular data without throwing", () => {
    const thrown: Record<string, unknown> = { reason: "impossible state" };
    thrown.self = thrown;

    const context = errorLogContext(thrown);
    expect(context).toMatchObject({
      "exception.type": "object",
    });
    expect(context["exception.details"]).toEqual(
      expect.stringContaining("[Circular]"),
    );
  });
});
