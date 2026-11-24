import nightsheetRaw from "./nightsheet.json";
import {
  cleanNightReminderText,
  getNightReminderPlan,
} from "./night-reminder-actions";
import { getEditionRoles, roleById } from "./catalog";
import type { GameScript, NightOrderEntry } from "./types";

type NightSheet = {
  firstNight: string[];
  otherNight: string[];
};

const systemNightEntries: Record<
  string,
  Omit<NightOrderEntry, "id" | "role" | "system" | "reminderActions">
> = {
  dusk: { name: "Dusk", reminder: "The night begins." },
  minioninfo: {
    name: "Minion Information",
    reminder: "Show the Minions the Demon and each other.",
  },
  demoninfo: {
    name: "Demon Information",
    reminder: "Show the Demon the Minions and three not-in-play characters.",
  },
  dawn: { name: "Dawn", reminder: "The night ends." },
};

function getNightIds(
  script: GameScript,
  night: "first" | "other",
  assignedTravellerIds: readonly string[],
) {
  const sheet: NightSheet = nightsheetRaw;
  const key = night === "first" ? "firstNight" : "otherNight";
  const officialOrder = sheet[key];
  const roster = new Set(getEditionRoles(script).map((role) => role.id));
  const extraTravellers = new Set(
    assignedTravellerIds.filter(
      (id) => !roster.has(id) && roleById.get(id)?.team === "traveller",
    ),
  );
  const override = typeof script === "object" ? script[key] : undefined;
  if (!override) {
    return officialOrder.filter(
      (id) =>
        Object.hasOwn(systemNightEntries, id) ||
        roster.has(id) ||
        extraTravellers.has(id),
    );
  }

  if (!extraTravellers.size) return override;
  // Insert guests before their next official wake without reordering the author's entries.
  const order = [...override];
  let insertAt = order.length;
  for (const id of [...officialOrder].reverse()) {
    const index = order.indexOf(id);
    if (index >= 0) insertAt = index;
    else if (extraTravellers.has(id)) order.splice(insertAt, 0, id);
  }
  return order;
}

export function getNightOrder(edition: GameScript, night: "first" | "other") {
  return getNightOrderEntries(edition, night).flatMap((entry) =>
    entry.role ? [entry.role] : [],
  );
}

export function getNightOrderEntries(
  edition: GameScript,
  night: "first" | "other",
  assignedTravellerIds: readonly string[] = [],
) {
  return getNightIds(edition, night, assignedTravellerIds).flatMap(
    (id): NightOrderEntry[] => {
      const systemEntry = systemNightEntries[id];
      if (systemEntry) {
        return [
          {
            id,
            ...systemEntry,
            reminderActions: [],
            role: null,
            system: true,
          },
        ];
      }

      const role = roleById.get(id);
      if (!role) return [];

      const plan = getNightReminderPlan(role.id, night);
      const rawReminder =
        (night === "first"
          ? role.firstNightReminder
          : role.otherNightReminder) ?? role.ability;

      return [
        {
          id,
          name: role.name,
          reminder: plan?.summary ?? cleanNightReminderText(rawReminder),
          reminderActions: plan?.actions ?? [],
          role,
          system: false,
        },
      ];
    },
  );
}
