"use client";

import { useCallback, useRef, useState } from "react";

import { useGameInvalidation } from "@/hooks/use-game-invalidation";
import { fetchPlayerGame } from "@/lib/api";
import { toAppError, type AppError } from "@/lib/app-error";
import type { PlayerSnapshot } from "@/lib/game-data/types";

export function usePlayerGame(
  gameCode: string,
  seatId: string,
  initialSnapshot: PlayerSnapshot,
) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [refreshStatus, setRefreshStatus] = useState<
    "idle" | "refreshing" | "error"
  >("idle");
  const [refreshError, setRefreshError] = useState<AppError | null>(null);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setRefreshStatus("refreshing");

    try {
      const result = await fetchPlayerGame(gameCode, seatId);
      if (requestId !== requestIdRef.current) return false;
      setSnapshot(result.snapshot);
      setRefreshError(null);
      setRefreshStatus("idle");
      return true;
    } catch (cause) {
      if (requestId !== requestIdRef.current) return false;
      setRefreshError(toAppError(cause, "Unable to refresh the game."));
      setRefreshStatus("error");
      return false;
    }
  }, [gameCode, seatId]);

  useGameInvalidation({
    gameCode,
    onInvalidate: () => {
      void refresh();
    },
  });

  return {
    snapshot,
    refresh,
    refreshError,
    isRefreshing: refreshStatus === "refreshing",
  };
}
