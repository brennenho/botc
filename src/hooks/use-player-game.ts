"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchPlayerGame } from "@/lib/api";
import type { PlayerSnapshot } from "@/lib/game-data/types";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function usePlayerGame(gameId: string, seatId: string) {
  const [snapshot, setSnapshot] = useState<PlayerSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchPlayerGame(gameId, seatId);
      setSnapshot(result.snapshot);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load game.");
    } finally {
      setLoading(false);
    }
  }, [gameId, seatId]);

  useEffect(() => {
    void refresh();
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const channel = supabase
      .channel(`player-game-version-${gameId}-${seatId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        () => void refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [gameId, refresh, seatId]);

  return { snapshot, loading, error };
}
