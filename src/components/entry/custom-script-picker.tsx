"use client";

import { Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ScriptPresets } from "./script-presets";
import { Button } from "@/components/ui/button";
import {
  maxScriptFileBytes,
  parseScriptExport,
} from "@/lib/game-data/custom-script";
import type { CustomScript } from "@/lib/game-data/types";

export const customScriptsLabel = "Custom scripts";

export function CustomScriptPicker({
  selected,
  onSelect,
}: {
  selected?: CustomScript;
  onSelect: (script: CustomScript, preview?: boolean) => void;
}) {
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const currentRead = useRef<File | null>(null);

  useEffect(() => {
    title.current?.focus();
    return () => {
      currentRead.current = null;
    };
  }, []);

  async function readFile(file: File) {
    currentRead.current = file;
    setReading(true);
    setError("");
    try {
      if (file.size > maxScriptFileBytes)
        throw new Error("Choose a JSON file smaller than 256 KB.");
      const contents = await file.text();
      if (currentRead.current !== file) return;
      const data: unknown = JSON.parse(contents.replace(/^\uFEFF/, ""));
      onSelect(parseScriptExport(data), true);
    } catch (cause) {
      if (currentRead.current !== file) return;
      setError(
        cause instanceof SyntaxError
          ? "This file is not valid JSON."
          : cause instanceof Error
            ? cause.message
            : "Unable to read this file.",
      );
    } finally {
      if (currentRead.current === file) {
        setReading(false);
        currentRead.current = null;
      }
    }
  }

  return (
    <section
      className="entry-step entry-script-library"
      aria-labelledby="custom-script-title"
    >
      <header className="entry-library-header">
        <div className="entry-step-heading">
          <h2 id="custom-script-title" ref={title} tabIndex={-1}>
            {customScriptsLabel}
          </h2>
        </div>
        <Button
          type="button"
          size="lg"
          variant="secondary"
          pending={reading}
          onClick={() => input.current?.click()}
        >
          {!reading && <Upload aria-hidden="true" size={16} />}
          {reading ? "Reading file…" : "Upload JSON"}
        </Button>
        <input
          ref={input}
          type="file"
          aria-label="Upload script JSON"
          accept=".json,application/json"
          hidden
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) void readFile(file);
          }}
        />
      </header>
      <p className="entry-library-description">
        Choose a preset or upload a JSON export from the{" "}
        <a
          href="https://script.bloodontheclocktower.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--oxblood)] underline underline-offset-2"
        >
          Script Tool
        </a>
        .
      </p>
      {error && (
        <p role="alert" className="entry-library-error">
          {error}
        </p>
      )}
      <ScriptPresets selected={selected} onSelect={onSelect} />
    </section>
  );
}
