export type GameStateFactories = {
  createId: () => string;
  now: () => string;
  random: () => number;
};

export const defaultGameStateFactories: GameStateFactories = {
  createId: () => crypto.randomUUID(),
  now: () => new Date().toISOString(),
  random: Math.random,
};

export type GameStateFactoryOverrides = Partial<GameStateFactories>;

export function resolveGameStateFactories(
  overrides: GameStateFactoryOverrides = {},
): GameStateFactories {
  return { ...defaultGameStateFactories, ...overrides };
}
