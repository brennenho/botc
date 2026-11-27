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

export function previousPhase({
  phase,
  dayNumber,
}: GamePhase): GamePhase | null {
  if (phase === "setup") return null;
  if (phase === "day") return { phase: "night", dayNumber };
  if (dayNumber === 1) return { phase: "setup", dayNumber: 1 };
  return { phase: "day", dayNumber: dayNumber - 1 };
}

export function phaseHistoryLabel(current: GamePhase, prior?: GamePhase) {
  const back = prior && previousPhase(prior);
  if (back?.phase === current.phase && back.dayNumber === current.dayNumber) {
    return `Returned to ${phaseLabel(current)}`;
  }
  return `${phaseLabel(current)} began`;
}
