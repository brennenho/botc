import {
  type PersistedStateCodec,
  usePersistedState,
} from "@/hooks/use-persisted-state";

const storagePrefix = "botc:grimoire-sheet-pinned:";
const booleanCodec: PersistedStateCodec<boolean> = {
  parse: (value) => value === "true",
  stringify: String,
};
const createDefaultPinState = () => false;

export function usePersistedGrimoireSheetPin(gameCode: string) {
  return usePersistedState(
    `${storagePrefix}${gameCode}`,
    createDefaultPinState,
    booleanCodec,
  );
}
