import {
  type PersistedStateCodec,
  usePersistedState,
} from "@/hooks/use-persisted-state";

import {
  createDefaultNightOrderState,
  normalizeNightOrderState,
  type NightOrderState,
} from "@/lib/night-order-state";

const storagePrefix = "botc:night-order:";
const nightOrderCodec: PersistedStateCodec<NightOrderState> = {
  parse: (value) => normalizeNightOrderState(JSON.parse(value) as unknown),
  stringify: JSON.stringify,
};

export function usePersistedNightOrderState(gameId: string) {
  return usePersistedState(
    `${storagePrefix}${gameId}`,
    createDefaultNightOrderState,
    nightOrderCodec,
  );
}
