import nightsheetRaw from "./nightsheet.json";
import {
  cleanNightReminderText,
  getNightReminderPlan,
} from "./night-reminder-actions";
import { getEditionRoles, roleById } from "./catalog";
import type { EditionId, NightOrderEntry, Role } from "./types";

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

function getNightIds(night: "first" | "other") {
  const sheet: NightSheet = nightsheetRaw;
  return night === "first" ? sheet.firstNight : sheet.otherNight;
}

export function getNightOrder(edition: EditionId, night: "first" | "other") {
  const editionRoleIds = new Set(
    getEditionRoles(edition).map((role) => role.id),
  );

  return getNightIds(night)
    .filter((id) => editionRoleIds.has(id))
    .map((id) => roleById.get(id))
    .filter((role): role is Role => Boolean(role));
}

export function getNightOrderEntries(
  edition: EditionId,
  night: "first" | "other",
) {
  const editionRoleIds = new Set(
    getEditionRoles(edition).map((role) => role.id),
  );

  return getNightIds(night).flatMap((id): NightOrderEntry[] => {
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
    if (!role || !editionRoleIds.has(id)) return [];

    const plan = getNightReminderPlan(role.id, night);
    const rawReminder =
      (night === "first" ? role.firstNightReminder : role.otherNightReminder) ??
      role.ability;

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
  });
}
