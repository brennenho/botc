"use client";

import { useEffect, useRef } from "react";

import {
  findKeyboardShortcut,
  shouldIgnoreKeyboardShortcut,
  type KeyboardShortcut,
} from "@/lib/keyboard-shortcuts";

export function useKeyboardShortcuts(
  shortcuts: readonly KeyboardShortcut[],
  enabled = true,
) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        shouldIgnoreKeyboardShortcut(event.target)
      ) {
        return;
      }

      const shortcut = findKeyboardShortcut(event, shortcutsRef.current);
      if (!shortcut || (event.repeat && !shortcut.allowRepeat)) return;

      event.preventDefault();
      shortcut.onTrigger();
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [enabled]);
}
