"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { GameInviteControl } from "@/components/grimoire/game-invite-control";
import { KeyboardShortcutsDialog } from "@/components/grimoire/keyboard-shortcuts-dialog";
import { ShortcutKey } from "@/components/ui/shortcut-key";
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
      key: "g",
      enabled: !inviteOpen,
      allowInModal: true,
      onTrigger: () => setShortcutsOpen((current) => !current),
    },
    {
      id: "invite-players",
      key: "v",
      enabled: !shortcutsOpen,
      allowInModal: true,
      onTrigger: () => setInviteOpen((current) => !current),
    },
    {
      id: "toggle-hide",
      key: "h",
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
          <span>Hide</span>
          <Switch
            checked={redacted}
            className="grimoire-redaction-switch"
            aria-keyshortcuts="H"
            title="Toggle hide · H"
            onCheckedChange={onRedactedChange}
          />
        </label>
        <button
          type="button"
          className="toolbar-shortcuts-button"
          aria-label="Open shortcut guide"
          aria-keyshortcuts="G"
          title="Open shortcut guide · G"
          onClick={() => setShortcutsOpen((current) => !current)}
        >
          <span>Keys</span>
          <ShortcutKey shortcut="G" />
        </button>
      </div>

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
