"use client";

import { Keyboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { GameInviteControl } from "@/components/grimoire/game-invite-control";
import { KeyboardShortcutsDialog } from "@/components/grimoire/keyboard-shortcuts-dialog";
import { IconButton } from "@/components/ui/icon-button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { getEdition } from "@/lib/game-data";
import type { EditionId } from "@/lib/game-data/types";

export function GrimoireToolbar({
  editionId,
  joinCode,
  actorRole,
  saveState,
  redacted,
  onRedactedChange,
}: {
  editionId: EditionId;
  joinCode: string;
  actorRole: "storyteller" | "player";
  saveState?: "idle" | "saving" | "error";
  redacted: boolean;
  onRedactedChange: (redacted: boolean) => void;
}) {
  const edition = getEdition(editionId);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useKeyboardShortcuts([
    {
      id: "show-shortcuts",
      key: "?",
      shift: true,
      onTrigger: () => setShortcutsOpen(true),
    },
    {
      id: "invite-players",
      key: "i",
      shift: true,
      onTrigger: () => setInviteOpen(true),
    },
    {
      id: "toggle-redaction",
      key: "r",
      shift: true,
      onTrigger: () => onRedactedChange(!redacted),
    },
  ]);

  return (
    <header className="grimoire-toolbar">
      <div className="toolbar-brand">
        <Link href="/" aria-label="Back to Home" className="edition-mark">
          <Image
            src={edition.logoPath}
            alt=""
            width={38}
            height={42}
            priority
          />
        </Link>
        <div>
          <p>{edition.name}</p>
        </div>
        <label className="grimoire-redaction-setting">
          <span>Redact</span>
          <Switch
            checked={redacted}
            className="grimoire-redaction-switch"
            aria-keyshortcuts="Shift+R"
            title="Toggle redaction · Shift+R"
            onCheckedChange={onRedactedChange}
          />
        </label>
      </div>

      <IconButton
        label="Keyboard Shortcuts"
        shortcut="?"
        size="sm"
        variant="quiet"
        tooltipSide="bottom"
        className="shortcut-help-button"
        onClick={() => setShortcutsOpen(true)}
      >
        <Keyboard className="size-4" />
      </IconButton>

      <GameInviteControl
        joinCode={joinCode}
        actorRole={actorRole}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />

      <KeyboardShortcutsDialog
        actorRole={actorRole}
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />

      {saveState === "saving" ? (
        <div className="toolbar-status is-saving" role="status">
          <Spinner />
          <span className="sr-only">Saving game changes</span>
        </div>
      ) : null}
    </header>
  );
}
