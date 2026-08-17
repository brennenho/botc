"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Check, Copy, Link2, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { getGameInvitationUrl } from "@/lib/game-invitation";
import { notify } from "@/lib/notifications";
import { trackEvent } from "@/lib/observability/client";

type ActorRole = "storyteller" | "player";
type CopiedValue = "link" | "code" | null;

async function writeToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.append(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();

  if (!copied) throw new Error("Clipboard unavailable");
}

export function GameInviteControl({
  joinCode,
  actorRole,
  open,
  onOpenChange,
}: {
  joinCode: string;
  actorRole: ActorRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [invitationUrl, setInvitationUrl] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [copiedValue, setCopiedValue] = useState<CopiedValue>(null);
  const copyResetTimeout = useRef<number | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setInvitationUrl(getGameInvitationUrl(joinCode, window.location.origin));
    setCanShare(typeof navigator.share === "function");
  }, [joinCode]);

  useEffect(
    () => () => {
      if (copyResetTimeout.current !== null) {
        window.clearTimeout(copyResetTimeout.current);
      }
    },
    [],
  );

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (nextOpen) {
      trackEvent("game_invitation_opened", { actor_role: actorRole });
    } else {
      setCopiedValue(null);
    }
  }

  function showCopied(value: Exclude<CopiedValue, null>) {
    setCopiedValue(value);
    if (copyResetTimeout.current !== null) {
      window.clearTimeout(copyResetTimeout.current);
    }
    copyResetTimeout.current = window.setTimeout(() => {
      setCopiedValue(null);
      copyResetTimeout.current = null;
    }, 1800);
  }

  async function copyInvitationLink() {
    try {
      await writeToClipboard(invitationUrl);
      showCopied("link");
      trackEvent("game_invitation_shared", {
        actor_role: actorRole,
        method: "link",
      });
      notify.success("Invitation link copied", { id: "invitation-copy" });
    } catch {
      notify.error("Couldn’t copy the invitation link", {
        id: "invitation-copy",
      });
    }
  }

  async function copyJoinCode() {
    try {
      await writeToClipboard(joinCode);
      showCopied("code");
      trackEvent("game_invitation_shared", {
        actor_role: actorRole,
        method: "code",
      });
      notify.success("Game code copied", { id: "invitation-copy" });
    } catch {
      notify.error("Couldn’t copy the game code", {
        id: "invitation-copy",
      });
    }
  }

  async function shareInvitation() {
    if (!navigator.share || !invitationUrl) return;

    try {
      await navigator.share({
        title: "Join my Blood on the Clocktower game",
        text: `Join my Blood on the Clocktower game. Game code: ${joinCode}`,
        url: invitationUrl,
      });
      trackEvent("game_invitation_shared", {
        actor_role: actorRole,
        method: "native",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      notify.error("Couldn’t open sharing options", {
        id: "invitation-share",
      });
    }
  }

  return (
    <>
      <button
        type="button"
        className="join-code-control"
        onClick={() => handleOpenChange(true)}
        aria-label={`Invite players to game ${joinCode}`}
        aria-keyshortcuts="Shift+I"
        title="Invite players · Shift+I"
      >
        <span className="utility-label">Invite players</span>
        <strong>{joinCode}</strong>
        <Share2 className="size-3.5" aria-hidden="true" />
      </button>

      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop invite-dialog-backdrop" />
          <Dialog.Viewport className="dialog-viewport invite-dialog-viewport">
            <Dialog.Popup
              className="invite-card"
              initialFocus={titleRef}
              data-keyboard-shortcuts-modal
            >
              <header className="invite-card-header">
                <Dialog.Title ref={titleRef} tabIndex={-1}>
                  Invite Players
                </Dialog.Title>
                <Dialog.Close
                  render={
                    <IconButton
                      label="Close player invitation"
                      variant="quiet"
                      tooltip={false}
                      className="invite-card-close"
                    >
                      <X className="size-4" />
                    </IconButton>
                  }
                />
              </header>

              <Dialog.Description className="invite-card-description">
                Scan the QR code or share the link to join.
              </Dialog.Description>

              <div className="invite-card-body">
                <div
                  className="invite-qr-frame"
                  aria-label="QR code for the player invitation link"
                  aria-busy={!invitationUrl}
                >
                  {invitationUrl ? (
                    <QRCodeSVG
                      value={invitationUrl}
                      size={208}
                      level="M"
                      bgColor="#f4f0e6"
                      fgColor="#232622"
                      title={`Join game ${joinCode}`}
                    />
                  ) : null}
                </div>

                <div className="invite-card-actions">
                  <div className="invite-code-block">
                    <span className="utility-label">Game code</span>
                    <div className="invite-code-value">
                      <strong>{joinCode}</strong>
                      <IconButton
                        label={
                          copiedValue === "code"
                            ? "Game code copied"
                            : "Copy game code"
                        }
                        variant="quiet"
                        size="sm"
                        className="invite-code-copy"
                        onClick={() => void copyJoinCode()}
                      >
                        <span
                          className="invite-copy-glyph"
                          data-copied={copiedValue === "code" || undefined}
                          aria-hidden="true"
                        >
                          <Copy className="invite-copy-glyph-copy" />
                          <Check className="invite-copy-glyph-check" />
                        </span>
                      </IconButton>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="invite-primary-action"
                    disabled={!invitationUrl}
                    onClick={() => void copyInvitationLink()}
                  >
                    {copiedValue === "link" ? (
                      <Check aria-hidden="true" />
                    ) : (
                      <Link2 aria-hidden="true" />
                    )}
                    {copiedValue === "link" ? "Link copied" : "Copy link"}
                  </Button>

                  {canShare ? (
                    <Button
                      size="lg"
                      variant="secondary"
                      className="invite-primary-action"
                      disabled={!invitationUrl}
                      onClick={() => void shareInvitation()}
                    >
                      <Share2 aria-hidden="true" />
                      Share link
                    </Button>
                  ) : null}
                </div>
              </div>

              <span className="sr-only" role="status" aria-live="polite">
                {copiedValue === "link"
                  ? "Invitation link copied"
                  : copiedValue === "code"
                    ? "Game code copied"
                    : ""}
              </span>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
