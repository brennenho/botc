import {
  GAME_INVALIDATION_EVENT,
  getGameInvalidationChannel,
  type GameInvalidationPayload,
} from "@/lib/game-invalidation";
import { normalizeGameCode } from "@/lib/game-code";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

async function reportInvalidationFailure(message: string, error?: unknown) {
  console.error(message, error);

  try {
    const { flushServerLogs, logServerEvent } =
      await import("@/lib/observability/logs");
    logServerEvent("warn", message, {
      component: "game_invalidation",
      error_type: error instanceof Error ? error.name : "unknown",
    });
    await flushServerLogs();
  } catch (loggingError) {
    console.error("Unable to report game invalidation failure.", loggingError);
  }
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
      await reportInvalidationFailure("Unable to broadcast game invalidation.");
    }
  } catch (error) {
    // Polling reconciles clients if Realtime is temporarily unavailable.
    await reportInvalidationFailure(
      "Unable to broadcast game invalidation.",
      error,
    );
  } finally {
    try {
      await supabase.removeChannel(channel);
    } catch (error) {
      await reportInvalidationFailure(
        "Unable to release game invalidation channel.",
        error,
      );
    }
  }
}
