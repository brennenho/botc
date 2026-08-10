import type { Alignment, NightOrderEntry } from "@/lib/game-data/types";

export type InformationQuestion =
  | "Did You Vote Today?"
  | "Did You Nominate Today?";

export type PlayerReveal =
  | { type: "demon-bluffs" }
  | { type: "demon-information" }
  | { type: "minion-information" }
  | { type: "role"; heading: string; roleId: string }
  | { type: "alignment"; alignment: Alignment }
  | { type: "question"; question: InformationQuestion };

export type NightRevealAction =
  | {
      kind: "reveal";
      id: string;
      label: string;
      reveal: PlayerReveal;
    }
  | {
      kind: "choose-role";
      id: string;
      label: string;
      chooseRoleHeading: string;
    };

const ROLE_INFO_TOKENS = [
  "THIS CHARACTER SELECTED YOU",
  "THIS PLAYER IS",
] as const;

function hasInfoToken(entry: NightOrderEntry, token: string) {
  return entry.reminder.includes(`*${token}*`);
}

export function getNightRevealActions(
  entry: NightOrderEntry,
): NightRevealAction[] {
  if (entry.id === "minioninfo") {
    return [
      {
        kind: "reveal",
        id: "show-demon",
        label: "Show the Demon",
        reveal: { type: "minion-information" },
      },
    ];
  }

  if (entry.id === "demoninfo") {
    return [
      {
        kind: "reveal",
        id: "show-demon-information",
        label: "Show Demon Information",
        reveal: { type: "demon-information" },
      },
    ];
  }

  if (!entry.role) return [];

  const actions: NightRevealAction[] = [];

  if (hasInfoToken(entry, "YOU ARE")) {
    actions.push({
      kind: "choose-role",
      id: "show-you-are",
      label: "Show Their Character",
      chooseRoleHeading: "You Are",
    });
  }

  for (const token of ROLE_INFO_TOKENS) {
    if (!hasInfoToken(entry, token)) continue;
    actions.push({
      kind: "reveal",
      id: `show-${token.toLowerCase().replaceAll(" ", "-")}`,
      label:
        token === "THIS CHARACTER SELECTED YOU"
          ? "Show Who Selected Them"
          : "Show Player Information",
      reveal: {
        type: "role",
        heading: token
          .toLowerCase()
          .replace(/\b\w/g, (letter) => letter.toUpperCase()),
        roleId: entry.role.id,
      },
    });
  }

  if (hasInfoToken(entry, "THESE CHARACTERS ARE NOT IN PLAY")) {
    actions.push({
      kind: "reveal",
      id: "show-not-in-play",
      label: "Show Demon Bluffs",
      reveal: { type: "demon-bluffs" },
    });
  }

  return actions;
}
