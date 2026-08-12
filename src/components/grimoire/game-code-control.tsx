"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function GameCodeControl({ joinCode }: { joinCode: string }) {
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
    <>
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
    </>
  );
}
