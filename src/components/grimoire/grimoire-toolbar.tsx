"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Clipboard } from "lucide-react";

import { getEdition } from "@/lib/game-data";
import type { EditionId } from "@/lib/game-data/types";
import { cn } from "@/lib/utils";

export function GrimoireToolbar({
  editionId,
  joinCode,
  saveState,
}: {
  editionId: EditionId;
  joinCode: string;
  saveState: "saved" | "saving" | "error";
}) {
  const edition = getEdition(editionId);

  return (
    <header className="grimoire-toolbar">
      <div className="toolbar-brand">
        <Link href="/" aria-label="Back to home" className="edition-mark">
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
      </div>

      <button
        type="button"
        className="join-code-control"
        onClick={() => void navigator.clipboard.writeText(joinCode)}
        title="Copy game code"
      >
        <span className="utility-label">Players join with</span>
        <strong>{joinCode}</strong>
        <Clipboard className="size-3.5" />
      </button>

      <div className="toolbar-status">
        <span
          className={cn("save-state", `is-${saveState}`)}
          title={
            saveState === "saving"
              ? "Saving"
              : saveState === "error"
                ? "Save failed"
                : "Saved"
          }
        >
          <Check className="size-3" />
        </span>
        <span>
          {saveState === "saving"
            ? "Saving"
            : saveState === "error"
              ? "Save failed"
              : "Saved"}
        </span>
      </div>
    </header>
  );
}
