export type NightReminderAction = {
  label: string;
  instruction: string;
  count?: number;
};

export type NightReminderPlan = {
  summary?: string;
  actions: NightReminderAction[];
};

type Night = "first" | "other";
type NightPlans = Partial<Record<Night, NightReminderPlan>>;

const both = (actions: NightReminderAction[]): NightPlans => ({
  first: { actions },
  other: { actions },
});

const plans: Record<string, NightPlans> = {
  grandmother: {
    other: {
      actions: [
        {
          label: "Dead",
          instruction:
            "Place Dead on the Grandmother if their grandchild was killed by the Demon.",
        },
      ],
    },
  },
  sailor: both([
    {
      label: "Drunk",
      instruction: "Place Drunk on whichever player becomes drunk.",
    },
  ]),
  snakecharmer: both([
    {
      label: "Poisoned",
      instruction:
        "Place Poisoned on the old Demon after a successful character swap.",
    },
  ]),
  innkeeper: {
    other: {
      actions: [
        {
          label: "Safe",
          count: 2,
          instruction: "Place Safe on each chosen player.",
        },
        {
          label: "Drunk",
          instruction: "Place Drunk on the chosen player who becomes drunk.",
        },
      ],
    },
  },
  monk: {
    other: {
      actions: [
        {
          label: "Safe",
          instruction: "Place Safe on the chosen player.",
        },
      ],
    },
  },
  gambler: {
    other: {
      actions: [
        {
          label: "Dead",
          instruction: "Place Dead on the Gambler if their guess was wrong.",
        },
      ],
    },
  },
  exorcist: {
    other: {
      actions: [
        {
          label: "Chosen",
          instruction: "Place Chosen on the selected player.",
        },
      ],
    },
  },
  gossip: {
    other: {
      actions: [
        {
          label: "Dead",
          instruction: "Place Dead on the player killed by the Gossip.",
        },
      ],
    },
  },
  courtier: both([
    {
      label: "Drunk 3",
      instruction: "Place Drunk 3 by the player with the chosen character.",
    },
    {
      label: "No Ability",
      instruction: "Place No Ability on the Courtier after they choose.",
    },
  ]),
  seamstress: both([
    {
      label: "No Ability",
      instruction: "Place No Ability on the Seamstress after they choose.",
    },
  ]),
  philosopher: both([
    {
      label: "Drunk",
      instruction:
        "Place Drunk on the player whose character ability was gained, if that character is in play.",
    },
  ]),
  professor: {
    other: {
      actions: [
        {
          label: "Alive",
          instruction: "Place Alive on the revived player.",
        },
        {
          label: "No Ability",
          instruction: "Place No Ability on the Professor after they choose.",
        },
      ],
    },
  },
  butler: both([
    {
      label: "Master",
      instruction: "Place Master on the chosen player.",
    },
  ]),
  tinker: {
    other: {
      actions: [
        {
          label: "Dead",
          instruction: "Place Dead on the Tinker if they die.",
        },
      ],
    },
  },
  sweetheart: {
    other: {
      actions: [
        {
          label: "Drunk",
          instruction:
            "Place Drunk on the player made drunk by the Sweetheart.",
        },
      ],
    },
  },
  moonchild: {
    other: {
      actions: [
        {
          label: "Dead",
          instruction: "Place Dead on the chosen good player if they die.",
        },
      ],
    },
  },
  godfather: {
    other: {
      actions: [
        {
          label: "Dead",
          instruction: "Place Dead on the player killed by the Godfather.",
        },
      ],
    },
  },
  poisoner: both([
    {
      label: "Poisoned",
      instruction: "Place Poisoned on the chosen player.",
    },
  ]),
  devilsadvocate: both([
    {
      label: "Survives Execution",
      instruction: "Place Survives Execution on the chosen player.",
    },
  ]),
  witch: both([
    {
      label: "Cursed",
      instruction: "Place Cursed on the chosen player.",
    },
  ]),
  cerenovus: both([
    {
      label: "Mad",
      instruction: "Place Mad on the chosen player.",
    },
  ]),
  assassin: {
    other: {
      actions: [
        {
          label: "Dead",
          instruction: "Place Dead on the player killed by the Assassin.",
        },
        {
          label: "No Ability",
          instruction: "Place No Ability on the Assassin after they choose.",
        },
      ],
    },
  },
  pukka: {
    first: {
      actions: [
        {
          label: "Poisoned",
          instruction: "Place Poisoned on the chosen player.",
        },
      ],
    },
    other: {
      actions: [
        {
          label: "Poisoned",
          instruction: "Place Poisoned on the newly chosen player.",
        },
        {
          label: "Dead",
          instruction:
            "Replace the previous Poisoned reminder with Dead when that player dies.",
        },
      ],
    },
  },
  nodashii: {
    other: {
      actions: [
        {
          label: "Dead",
          instruction: "Place Dead on the chosen player.",
        },
      ],
    },
  },
  imp: {
    other: {
      actions: [
        {
          label: "Dead",
          instruction: "Place Dead on the chosen player.",
        },
      ],
    },
  },
  shabaloth: {
    other: {
      actions: [
        {
          label: "Alive",
          instruction: "Replace Dead with Alive if a player is regurgitated.",
        },
        {
          label: "Dead",
          count: 2,
          instruction: "Place Dead on each chosen player.",
        },
      ],
    },
  },
  po: {
    other: {
      summary:
        "The Po may choose one player, or three players if they chose no one last night.",
      actions: [
        {
          label: "3 Attacks",
          instruction: "Place 3 Attacks on the Po when no player is chosen.",
        },
        {
          label: "Dead",
          count: 3,
          instruction: "Place Dead on each chosen player.",
        },
      ],
    },
  },
  zombuul: {
    other: {
      actions: [
        {
          label: "Dead",
          instruction: "Place Dead on the chosen player.",
        },
      ],
    },
  },
  vigormortis: {
    other: {
      actions: [
        {
          label: "Dead",
          instruction: "Place Dead on the chosen player.",
        },
        {
          label: "Poisoned",
          count: 2,
          instruction:
            "If a Minion died, place Poisoned on each neighboring Townsfolk.",
        },
      ],
    },
  },
  vortox: {
    other: {
      actions: [
        {
          label: "Dead",
          instruction: "Place Dead on the chosen player.",
        },
      ],
    },
  },
  fanggu: {
    other: {
      actions: [
        {
          label: "Dead",
          instruction: "Place Dead on the chosen player.",
        },
        {
          label: "Once",
          instruction: "Place Once on the new Fang Gu after a jump.",
        },
      ],
    },
  },
  thief: both([
    {
      label: "Negative Vote",
      instruction: "Place Negative Vote on the chosen player.",
    },
  ]),
  bureaucrat: both([
    {
      label: "3 Votes",
      instruction: "Place 3 Votes on the chosen player.",
    },
  ]),
  barista: both([
    {
      label: "Sober & Healthy",
      instruction:
        "Place Sober & Healthy on the chosen player when that effect is used.",
    },
    {
      label: "Acts Twice",
      instruction:
        "Place Acts Twice on the chosen player when that effect is used.",
    },
  ]),
  harlot: {
    other: {
      actions: [
        {
          label: "Dead",
          count: 2,
          instruction:
            "Place Dead on the Harlot and chosen player if they die.",
        },
      ],
    },
  },
  bonecollector: {
    other: {
      actions: [
        {
          label: "Has Ability",
          instruction: "Place Has Ability on the chosen dead player.",
        },
        {
          label: "No Ability",
          instruction:
            "Place No Ability on the Bone Collector after they choose.",
        },
      ],
    },
  },
  apprentice: {
    first: {
      actions: [
        {
          label: "Is The Apprentice",
          instruction: "Place Is The Apprentice on the Apprentice.",
        },
      ],
    },
  },
};

export function getNightReminderPlan(roleId: string, night: Night) {
  return plans[roleId]?.[night] ?? null;
}

export function cleanNightReminderText(text: string) {
  return text
    .replace(/\s*:reminder:\s*/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export const nightReminderPlans = plans;
