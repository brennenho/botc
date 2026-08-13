"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useGameInvalidation } from "@/hooks/use-game-invalidation";
import { fetchPlayerGame } from "@/lib/api";
import type { PlayerSnapshot } from "@/lib/game-data/types";

export function usePlayerGame(gameCode: string, seatId: string) {
  const [snapshot, setSnapshot] = useState<PlayerSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      const result = await fetchPlayerGame(gameCode, seatId);
      if (requestId !== requestIdRef.current) return;
      setSnapshot(result.snapshot);
      setError(null);
    } catch (cause) {
      if (requestId !== requestIdRef.current) return;
      setError(cause instanceof Error ? cause.message : "Unable to load game.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [gameCode, seatId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useGameInvalidation({
    gameCode,
    onInvalidate: refresh,
  });

  return { snapshot, loading, error, refresh };
}
