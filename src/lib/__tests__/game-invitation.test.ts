import { describe, expect, it } from "vitest";

import {
  getGameInvitationPath,
  getGameInvitationUrl,
} from "@/lib/game-invitation";

describe("game invitations", () => {
  it("builds a clean normalized invitation path", () => {
    expect(getGameInvitationPath(" gptar2 ")).toBe("/join/GPTAR2");
  });

  it("builds invitation URLs for the current deployment origin", () => {
    expect(
      getGameInvitationUrl("GPTAR2", "https://clocktower.example/preview"),
    ).toBe("https://clocktower.example/join/GPTAR2");
  });
});
