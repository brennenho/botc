"use client";

import { useEffect, useRef } from "react";

import {
  GAME_INVALIDATION_EVENT,
  getGameInvalidationChannel,
} from "@/lib/game-invalidation";
import { getSupabaseBrowser } from "@/lib/supabase/client";

const RECONCILIATION_INTERVAL_MS = 15_000;

type UseGameInvalidationOptions = {
  gameCode: string;
  onInvalidate: () => void | Promise<void>;
};

/**
 * Realtime keeps active games responsive; focus and polling recover any event
 * missed while a browser was suspended or a websocket was reconnecting.
 */
export function useGameInvalidation({
  gameCode,
  onInvalidate,
}: UseGameInvalidationOptions) {
  const callbackRef = useRef(onInvalidate);

  useEffect(() => {
    callbackRef.current = onInvalidate;
  }, [onInvalidate]);

  useEffect(() => {
    const invalidate = () => void callbackRef.current();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") invalidate();
    };
    const poll = window.setInterval(invalidate, RECONCILIATION_INTERVAL_MS);

    window.addEventListener("focus", invalidate);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const supabase = getSupabaseBrowser();
    const channel = supabase
      .channel(getGameInvalidationChannel(gameCode))
      .on("broadcast", { event: GAME_INVALIDATION_EVENT }, invalidate)
      .subscribe();

    return () => {
      window.clearInterval(poll);
      window.removeEventListener("focus", invalidate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void supabase.removeChannel(channel);
    };
  }, [gameCode]);
}
