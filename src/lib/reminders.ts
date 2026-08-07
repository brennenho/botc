import type { GameToken, Role } from "@/lib/game-data/types";
import {
  readReminderPlacement,
  withReminderPlacement,
  type ReminderPlacement,
} from "@/lib/grimoire-canvas";

export type ReminderDefinition = {
  key: string;
  label: string;
  roleId: string | null;
  sourceName: string;
  copies: number;
};

const generalReminderLabels = ["Poisoned", "Drunk", "Mad", "Is the Demon"];

function reminderKey(roleId: string | null, label: string) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${roleId ? `role:${roleId}` : "general"}:${slug}`;
}

export const generalReminderDefinitions: ReminderDefinition[] =
  generalReminderLabels.map((label) => ({
    key: reminderKey(null, label),
    label,
    roleId: null,
    sourceName: "General",
    copies: Number.POSITIVE_INFINITY,
  }));

export function getRoleReminderDefinitions(role: Role | null) {
  if (!role) return [];

  const grouped = new Map<string, ReminderDefinition>();
  for (const label of role.reminders) {
    const key = reminderKey(role.id, label);
    const existing = grouped.get(key);
    grouped.set(key, {
      key,
      label,
      roleId: role.id,
      sourceName: role.name,
      copies: (existing?.copies ?? 0) + 1,
    });
  }

  return [...grouped.values()];
}

export function getReminderDefinition(
  role: Role | null,
  label: string,
): ReminderDefinition {
  return (
    getRoleReminderDefinitions(role).find(
      (definition) => definition.label === label,
    ) ?? {
      key: reminderKey(role?.id ?? null, label),
      label,
      roleId: role?.id ?? null,
      sourceName: role?.name ?? "General",
      copies: Number.POSITIVE_INFINITY,
    }
  );
}

export function getReminderKey(token: GameToken) {
  const storedKey = token.metadata.reminderKey;
  return typeof storedKey === "string"
    ? storedKey
    : reminderKey(token.roleId, token.label);
}

export function withReminderKey(
  metadata: Record<string, unknown>,
  key: string,
) {
  return { ...metadata, reminderKey: key };
}

function anchoredOrder(token: GameToken) {
  const placement = readReminderPlacement(token);
  return placement.mode === "anchored" ? placement.order : token.position;
}

export function getAnchoredReminders(tokens: GameToken[], seatId: string) {
  return tokens
    .filter(
      (token) =>
        token.tokenType === "reminder" &&
        token.seatId === seatId &&
        readReminderPlacement(token).mode === "anchored",
    )
    .sort((a, b) => anchoredOrder(a) - anchoredOrder(b));
}

export function updateReminderPlacement(
  tokens: GameToken[],
  tokenId: string,
  placement: ReminderPlacement,
  targetSeatId?: string,
) {
  const active = tokens.find((token) => token.id === tokenId);
  if (active?.tokenType !== "reminder") return tokens;

  const sourceSeatId = active.seatId;
  const nextSeatId = targetSeatId ?? sourceSeatId;
  let nextTokens = tokens.map((token) =>
    token.id === tokenId
      ? {
          ...token,
          seatId: nextSeatId,
          metadata: withReminderPlacement(token.metadata, placement),
        }
      : token,
  );

  const seatsToNormalize = new Set(
    [sourceSeatId, nextSeatId].filter((seatId): seatId is string =>
      Boolean(seatId),
    ),
  );

  for (const seatId of seatsToNormalize) {
    const anchored = getAnchoredReminders(nextTokens, seatId).filter(
      (token) => token.id !== tokenId,
    );
    const activeForSeat = nextTokens.find(
      (token) =>
        token.id === tokenId &&
        token.seatId === seatId &&
        readReminderPlacement(token).mode === "anchored",
    );

    if (activeForSeat) {
      const requestedOrder =
        placement.mode === "anchored" ? placement.order : anchored.length;
      anchored.splice(
        Math.max(0, Math.min(anchored.length, requestedOrder)),
        0,
        activeForSeat,
      );
    }

    const orderById = new Map(
      anchored.map((token, order) => [token.id, order]),
    );
    nextTokens = nextTokens.map((token) => {
      const order = orderById.get(token.id);
      return order === undefined
        ? token
        : {
            ...token,
            metadata: withReminderPlacement(token.metadata, {
              mode: "anchored",
              order,
            }),
          };
    });
  }

  return nextTokens;
}
