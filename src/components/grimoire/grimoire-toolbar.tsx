"use client";

import Image from "next/image";
import Link from "next/link";

import { GameCodeControl } from "@/components/grimoire/game-code-control";
import { Spinner } from "@/components/ui/spinner";
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
  saveState?: "idle" | "saving" | "error";
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

      {saveState === "saving" ? (
        <div className="toolbar-status is-saving" role="status">
          <Spinner />
          <span className="sr-only">Saving game changes</span>
        </div>
      ) : null}
    </header>
  );
}
