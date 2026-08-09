"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, CircleAlert, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getEdition } from "@/lib/game-data";
import type { EditionId } from "@/lib/game-data/types";

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
  const [copied, setCopied] = useState(false);
  const copyResetTimeout = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyResetTimeout.current !== null) {
        window.clearTimeout(copyResetTimeout.current);
      }
    },
    [],
  );

  async function copyJoinCode() {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);

      if (copyResetTimeout.current !== null) {
        window.clearTimeout(copyResetTimeout.current);
      }

      copyResetTimeout.current = window.setTimeout(() => {
        setCopied(false);
        copyResetTimeout.current = null;
      }, 1500);
    } catch {
      setCopied(false);
    }
  }

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
      </div>

      <button
        type="button"
        className="join-code-control"
        onClick={() => void copyJoinCode()}
        aria-label={
          copied
            ? `Player Join Code ${joinCode} Copied`
            : `Copy Player Join Code ${joinCode}`
        }
        title={copied ? "Player Join Code Copied" : "Copy Player Join Code"}
      >
        <span className="utility-label">Player Join Code</span>
        <strong>{joinCode}</strong>
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>

      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Player Join Code Copied" : ""}
      </span>

      <span className="sr-only" role="status" aria-live="polite">
        {saveState === "saving"
          ? "Saving Game Changes"
          : saveState === "error"
            ? "Game Changes Could Not Be Saved"
            : "Game Changes Saved"}
      </span>

      {saveState === "error" ? (
        <div className="toolbar-status" role="alert">
          <CircleAlert className="size-3.5" />
          <span>Changes Not Saved</span>
        </div>
      ) : null}
    </header>
  );
}
