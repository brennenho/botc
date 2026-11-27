export const nightOrderNights = ["first", "other"] as const;
export const nightOrderScopes = ["alive", "all"] as const;

export type NightOrderNight = (typeof nightOrderNights)[number];
export type NightOrderScope = (typeof nightOrderScopes)[number];
export type NightOrderViewKey = `${NightOrderNight}:${NightOrderScope}`;

export type NightOrderState = {
  trackedNight?: number;
  night: NightOrderNight;
  scope: NightOrderScope;
  smallGameEvilInfo?: boolean;
  completed: Partial<Record<NightOrderViewKey, string[]>>;
};

const nightOrderViewKeys: NightOrderViewKey[] = [
  "first:alive",
  "first:all",
  "other:alive",
  "other:all",
];

export function createDefaultNightOrderState(): NightOrderState {
  return {
    night: "first",
    scope: "alive",
    completed: {},
  };
}

export function getNightOrderViewKey(
  night: NightOrderNight,
  scope: NightOrderScope,
): NightOrderViewKey {
  return `${night}:${scope}`;
}

export function checklistForNight(
  state: NightOrderState,
  nightNumber?: number,
): NightOrderState {
  if (nightNumber === undefined || state.trackedNight === nightNumber)
    return state;
  return {
    ...state,
    trackedNight: nightNumber,
    night: nightNumber === 1 ? "first" : "other",
    completed: {},
  };
}

export function normalizeNightOrderState(value: unknown): NightOrderState {
  const fallback = createDefaultNightOrderState();
  if (!value || typeof value !== "object") return fallback;

  const candidate = value as {
    trackedNight?: unknown;
    night?: unknown;
    scope?: unknown;
    smallGameEvilInfo?: unknown;
    completed?: unknown;
  };
  const completedSource =
    candidate.completed && typeof candidate.completed === "object"
      ? (candidate.completed as Record<string, unknown>)
      : {};
  const completed = Object.fromEntries(
    nightOrderViewKeys.flatMap((key) => {
      const entries = completedSource[key];
      return Array.isArray(entries) &&
        entries.every((entry) => typeof entry === "string")
        ? [[key, [...new Set(entries)]]]
        : [];
    }),
  ) as NightOrderState["completed"];

  return {
    night: nightOrderNights.includes(candidate.night as NightOrderNight)
      ? (candidate.night as NightOrderNight)
      : fallback.night,
    scope: nightOrderScopes.includes(candidate.scope as NightOrderScope)
      ? (candidate.scope as NightOrderScope)
      : fallback.scope,
    completed,
    ...(typeof candidate.trackedNight === "number" &&
      Number.isInteger(candidate.trackedNight) &&
      candidate.trackedNight > 0 && { trackedNight: candidate.trackedNight }),
    ...(candidate.smallGameEvilInfo === true && { smallGameEvilInfo: true }),
  };
}
