import {
  GAME_INVALIDATION_EVENT,
  getGameInvalidationChannel,
  type GameInvalidationPayload,
} from "@/lib/game-invalidation";
import { normalizeGameCode } from "@/lib/game-code";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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
      console.error("Unable to broadcast game invalidation.", { result });
    }
  } catch (error) {
    // Polling reconciles clients if Realtime is temporarily unavailable.
    console.error("Unable to broadcast game invalidation.", error);
  } finally {
    try {
      await supabase.removeChannel(channel);
    } catch (error) {
      console.error("Unable to release game invalidation channel.", error);
    }
  }
}
