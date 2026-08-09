"use client";

import { useEffect, useState } from "react";

const storagePrefix = "botc:grimoire-sheet-pinned:";

export function usePersistedGrimoireSheetPin(gameId: string) {
  const storageKey = `${storagePrefix}${gameId}`;
  const [pinned, setPinned] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      setPinned(window.localStorage.getItem(storageKey) === "true");
    } catch {
      setPinned(false);
    }
    setLoadedKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (loadedKey !== storageKey) return;
    try {
      window.localStorage.setItem(storageKey, String(pinned));
    } catch {
      // Pinning still works for the current session when storage is unavailable.
    }
  }, [loadedKey, pinned, storageKey]);

  return [pinned, setPinned] as const;
}
