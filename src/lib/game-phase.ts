import type { GamePhase } from "@/lib/game-data/types";

export function phaseLabel({ phase, dayNumber }: GamePhase) {
  if (phase === "setup") return "Setup";
  return `${phase === "day" ? "Day" : "Night"} ${dayNumber}`;
}

export function nextPhase({ phase, dayNumber }: GamePhase): GamePhase {
  if (phase === "setup") return { phase: "night", dayNumber: 1 };
  if (phase === "night") return { phase: "day", dayNumber };
  return { phase: "night", dayNumber: dayNumber + 1 };
}
