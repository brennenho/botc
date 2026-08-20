import {
  GAME_INVALIDATION_EVENT,
  getGameInvalidationChannel,
  type GameInvalidationPayload,
} from "@/lib/game-invalidation";
import { normalizeGameCode } from "@/lib/game-code";
import { errorLogContext } from "@/lib/observability/error-details";
import { logger } from "@/lib/observability/logger";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function logInvalidationFailure(message: string, error?: unknown) {
  logger.warn(message, {
    component: "game_invalidation",
    outcome: "expected_degradation",
    ...(error === undefined ? {} : errorLogContext(error)),
  });
}

export async function broadcastGameInvalidation(
  gameCode: string,
  version: number,
) {
  const supabase = getSupabaseAdmin();
  const normalizedCode = normalizeGameCode(gameCode);
  const channel = supabase.channel(getGameInvalidationChannel(normalizedCode));
  const payload: GameInvalidationPayload = {
    gameCode: normalizedCode,
    version,
  };

  try {
    const result = await channel.httpSend(GAME_INVALIDATION_EVENT, payload);
    if (!result.success) {
      logInvalidationFailure("Unable to broadcast game invalidation.");
    }
  } catch (error) {
    // Polling reconciles clients if Realtime is temporarily unavailable.
    logInvalidationFailure("Unable to broadcast game invalidation.", error);
  } finally {
    try {
      await supabase.removeChannel(channel);
    } catch (error) {
      logInvalidationFailure(
        "Unable to release game invalidation channel.",
        error,
      );
    }
  }
}
