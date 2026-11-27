"use client";

import Image from "next/image";
import Link from "next/link";
import { Keyboard } from "lucide-react";
import { useState } from "react";

import { GameInviteControl } from "@/components/grimoire/game-invite-control";
import { KeyboardShortcutsDialog } from "@/components/grimoire/keyboard-shortcuts-dialog";
import { IconButton } from "@/components/ui/icon-button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { getEdition } from "@/lib/game-data";
import type { Game } from "@/lib/game-data/types";
import { phaseLabel } from "@/lib/game-phase";

export function GrimoireToolbar({
  game,
  actorRole,
  saveState,
  redacted,
  onRedactedChange,
}: {
  game: Pick<Game, "edition" | "joinCode" | "phase" | "dayNumber">;
  actorRole: "storyteller" | "player";
  saveState?: "idle" | "saving" | "error";
  redacted: boolean;
  onRedactedChange: (redacted: boolean) => void;
}) {
  const edition = getEdition(game.edition);
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
      key: "j",
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
        <div className="toolbar-edition">
          <p>{edition.name}</p>
          {!redacted && (
            <small className="toolbar-phase">{phaseLabel(game)}</small>
          )}
        </div>
        <label className="grimoire-redaction-setting">
          <span>Hide</span>
          <Tooltip
            content="Toggle Hide"
            shortcuts={["H"]}
            shortcutSize="sm"
            side="bottom"
          >
            <Switch
              checked={redacted}
              className="grimoire-redaction-switch"
              aria-keyshortcuts="H"
              onCheckedChange={onRedactedChange}
            />
          </Tooltip>
        </label>
        <IconButton
          type="button"
          size="sm"
          variant="quiet"
          label="Open keyboard shortcuts"
          tooltip="Keyboard shortcuts"
          tooltipSide="bottom"
          shortcut="G"
          className="toolbar-shortcuts-button"
          onClick={() => setShortcutsOpen((current) => !current)}
        >
          <Keyboard aria-hidden="true" />
        </IconButton>
      </div>

      <GameInviteControl
        joinCode={game.joinCode}
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
