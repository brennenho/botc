import {
  type PersistedStateCodec,
  usePersistedState,
} from "@/hooks/use-persisted-state";

import {
  checklistForNight,
  createDefaultNightOrderState,
  normalizeNightOrderState,
  type NightOrderState,
} from "@/lib/night-order-state";

const storagePrefix = "botc:night-order:";
const nightOrderCodec: PersistedStateCodec<NightOrderState> = {
  parse: (value) => normalizeNightOrderState(JSON.parse(value) as unknown),
  stringify: JSON.stringify,
};

export function usePersistedNightOrderState(
  gameCode: string,
  nightNumber?: number,
) {
  const [state, setState] = usePersistedState(
    `${storagePrefix}${gameCode}`,
    createDefaultNightOrderState,
    nightOrderCodec,
  );
  return [checklistForNight(state, nightNumber), setState] as const;
}
