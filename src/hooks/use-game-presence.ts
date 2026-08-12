"use client";

import { useEffect, useState } from "react";

import { normalizeGameCode } from "@/lib/game-code";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type PlayerPresence = {
  seatId: string;
  onlineAt: string;
};

export function useGamePresence(gameCode: string, ownSeatId?: string) {
  const [onlineSeatIds, setOnlineSeatIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const normalizedCode = normalizeGameCode(gameCode);
    const channel = supabase.channel(
      `game-presence-${normalizedCode}`,
      ownSeatId
        ? { config: { presence: { key: `seat:${ownSeatId}` } } }
        : undefined,
    );

    function syncPresence() {
      const presenceState = channel.presenceState<PlayerPresence>();
      setOnlineSeatIds(
        new Set(
          Object.values(presenceState)
            .flat()
            .map((presence) => presence.seatId)
            .filter(Boolean),
        ),
      );
    }

    channel
      .on("presence", { event: "sync" }, syncPresence)
      .subscribe((status) => {
        const statusName = String(status);

        if (statusName === "SUBSCRIBED" && ownSeatId) {
          void channel.track({
            seatId: ownSeatId,
            onlineAt: new Date().toISOString(),
          } satisfies PlayerPresence);
        }

        if (
          statusName === "CHANNEL_ERROR" ||
          statusName === "TIMED_OUT" ||
          statusName === "CLOSED"
        ) {
          setOnlineSeatIds(new Set());
        }
      });

    return () => {
      if (ownSeatId) void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [gameCode, ownSeatId]);

  return onlineSeatIds;
}
