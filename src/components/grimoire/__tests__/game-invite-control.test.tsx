// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GameInviteControl } from "@/components/grimoire/game-invite-control";
import { getGameInvitationUrl } from "@/lib/game-invitation";
import { trackEvent } from "@/lib/observability/client";

const notificationMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
  notify: notificationMocks,
}));

vi.mock("@/lib/observability/client", () => ({
  trackEvent: vi.fn(),
}));

function TestGameInviteControl({
  joinCode,
  actorRole,
}: {
  joinCode: string;
  actorRole: "storyteller" | "player";
}) {
  const [open, setOpen] = useState(false);

  return (
    <GameInviteControl
      joinCode={joinCode}
      actorRole={actorRole}
      open={open}
      onOpenChange={setOpen}
    />
  );
}

describe("GameInviteControl", () => {
  const writeText = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => cleanup());

  it("opens an accessible invitation and copies its deployment URL", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<TestGameInviteControl joinCode="abc234" actorRole="storyteller" />);

    await user.click(
      screen.getByRole("button", { name: "Invite players to game abc234" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Invite Players" });
    expect(dialog).toBeVisible();
    expect(
      screen.getByLabelText("QR code for the player invitation link"),
    ).toBeVisible();
    expect(trackEvent).toHaveBeenCalledWith("game_invitation_opened", {
      actor_role: "storyteller",
    });

    await user.click(screen.getByRole("button", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith(
      getGameInvitationUrl("abc234", window.location.origin),
    );
    expect(screen.getByRole("button", { name: "Link copied" })).toBeVisible();
    expect(notificationMocks.success).toHaveBeenCalledWith(
      "Invitation link copied",
      {
        id: "invitation-copy",
      },
    );
    expect(trackEvent).toHaveBeenCalledWith("game_invitation_shared", {
      actor_role: "storyteller",
      method: "link",
    });
  });

  it("reports clipboard failures without claiming the link was shared", async () => {
    const user = userEvent.setup();
    writeText.mockRejectedValueOnce(new Error("clipboard denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<TestGameInviteControl joinCode="ABC234" actorRole="player" />);

    await user.click(
      screen.getByRole("button", { name: "Invite players to game ABC234" }),
    );
    await user.click(screen.getByRole("button", { name: "Copy link" }));

    await waitFor(() =>
      expect(notificationMocks.error).toHaveBeenCalledWith(
        "Couldn’t copy the invitation link",
        { id: "invitation-copy" },
      ),
    );
    expect(trackEvent).not.toHaveBeenCalledWith(
      "game_invitation_shared",
      expect.anything(),
    );
    expect(screen.getByRole("button", { name: "Copy link" })).toBeVisible();
  });

  it("uses native sharing when the browser supports it", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share,
    });
    const user = userEvent.setup();
    render(<TestGameInviteControl joinCode="ABC234" actorRole="storyteller" />);

    await user.click(
      screen.getByRole("button", { name: "Invite players to game ABC234" }),
    );
    await user.click(await screen.findByRole("button", { name: "Share link" }));

    expect(share).toHaveBeenCalledWith({
      title: "Join my Blood on the Clocktower game",
      text: "Join my Blood on the Clocktower game. Game code: ABC234",
      url: getGameInvitationUrl("ABC234", window.location.origin),
    });
    expect(trackEvent).toHaveBeenCalledWith("game_invitation_shared", {
      actor_role: "storyteller",
      method: "native",
    });
  });
});
