"use client";

import Image from "next/image";
import Link from "next/link";
import { CircleAlert } from "lucide-react";

import { GameCodeControl } from "@/components/grimoire/game-code-control";
import { Switch } from "@/components/ui/switch";
import { getEdition } from "@/lib/game-data";
import type { EditionId } from "@/lib/game-data/types";

export function GrimoireToolbar({
  editionId,
  joinCode,
  saveState,
  redacted,
  onRedactedChange,
}: {
  editionId: EditionId;
  joinCode: string;
  saveState?: "saved" | "saving" | "error";
  redacted: boolean;
  onRedactedChange: (redacted: boolean) => void;
}) {
  const edition = getEdition(editionId);

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
            onCheckedChange={onRedactedChange}
          />
        </label>
      </div>

      <GameCodeControl joinCode={joinCode} />

      {saveState && (
        <span className="sr-only" role="status" aria-live="polite">
          {saveState === "saving"
            ? "Saving Game Changes"
            : saveState === "error"
              ? "Game Changes Could Not Be Saved"
              : "Game Changes Saved"}
        </span>
      )}

      {saveState === "error" ? (
        <div className="toolbar-status" role="alert">
          <CircleAlert className="size-3.5" />
          <span>Changes Not Saved</span>
        </div>
      ) : null}
    </header>
  );
}
