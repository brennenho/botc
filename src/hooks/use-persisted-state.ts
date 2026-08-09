"use client";

import { useEffect, useState } from "react";

export type PersistedStateCodec<T> = {
  parse: (value: string) => T;
  stringify: (value: T) => string;
};

export function usePersistedState<T>(
  storageKey: string,
  createDefault: () => T,
  codec: PersistedStateCodec<T>,
) {
  const [state, setState] = useState<T>(createDefault);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      setState(stored === null ? createDefault() : codec.parse(stored));
    } catch {
      setState(createDefault());
    }
    setLoadedKey(storageKey);
  }, [codec, createDefault, storageKey]);

  useEffect(() => {
    if (loadedKey !== storageKey) return;

    try {
      window.localStorage.setItem(storageKey, codec.stringify(state));
    } catch {
      // State remains available for the current session when storage is blocked.
    }
  }, [codec, loadedKey, state, storageKey]);

  return [state, setState] as const;
}
