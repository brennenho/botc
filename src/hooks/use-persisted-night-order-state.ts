"use client";

import { useEffect, useState } from "react";

import {
  createDefaultNightOrderState,
  normalizeNightOrderState,
  type NightOrderState,
} from "@/lib/night-order-state";

const storagePrefix = "botc:night-order:";

export function usePersistedNightOrderState(gameId: string) {
  const storageKey = `${storagePrefix}${gameId}`;
  const [state, setState] = useState<NightOrderState>(
    createDefaultNightOrderState,
  );
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      setState(
        stored
          ? normalizeNightOrderState(JSON.parse(stored) as unknown)
          : createDefaultNightOrderState(),
      );
    } catch {
      setState(createDefaultNightOrderState());
    }
    setLoadedKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (loadedKey !== storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // The controls still work for the current session when storage is unavailable.
    }
  }, [loadedKey, state, storageKey]);

  return [state, setState] as const;
}
