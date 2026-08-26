import type { GameToken, Role } from "@/lib/game-data/types";
import { roleById } from "@/lib/game-data/catalog";
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

const supplementalReminderLabels: Partial<Record<string, string[]>> = {
  drunk: ["Is The Drunk"],
  philosopher: ["Is The Philosopher"],
};

const physicalReminderLabelOverrides: Partial<
  Record<string, Record<string, string>>
> = {
  towncrier: {
    "Minions Not Nominated": "Minion Not Nominated",
  },
};

function reminderKey(roleId: string | null, label: string) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${roleId ? `role:${roleId}` : "general"}:${slug}`;
}

function physicalReminderLabel(roleId: string | null, label: string) {
  return roleId
    ? (physicalReminderLabelOverrides[roleId]?.[label] ?? label)
    : label;
}

export function getReminderCopyLimit(definition: ReminderDefinition) {
  return Number.isFinite(definition.copies)
    ? Math.max(1, Math.floor(definition.copies))
    : 1;
}

export function getRoleReminderDefinitions(role: Role | null) {
  if (!role) return [];

  const labels = [
    ...role.reminders,
    ...(supplementalReminderLabels[role.id] ?? []),
  ].map((label) => physicalReminderLabelOverrides[role.id]?.[label] ?? label);
  const grouped = new Map<string, ReminderDefinition>();
  for (const label of labels) {
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
  const physicalLabel = physicalReminderLabel(role?.id ?? null, label);
  return (
    getRoleReminderDefinitions(role).find(
      (definition) => definition.label === physicalLabel,
    ) ?? {
      key: reminderKey(role?.id ?? null, physicalLabel),
      label: physicalLabel,
      roleId: role?.id ?? null,
      sourceName: role?.name ?? "General",
      copies: 1,
    }
  );
}

export function getReminderDefinitionForToken(token: GameToken) {
  const role = token.roleId ? (roleById.get(token.roleId) ?? null) : null;
  if (role) return getReminderDefinition(role, token.label);

  const label = physicalReminderLabel(token.roleId, token.label);
  return {
    key: reminderKey(token.roleId, label),
    label,
    roleId: token.roleId,
    sourceName: token.roleId ?? "General",
    copies: 1,
  } satisfies ReminderDefinition;
}

export function getReminderKey(token: GameToken) {
  return getReminderDefinitionForToken(token).key;
}

export function withReminderKey(
  metadata: Record<string, unknown>,
  key: string,
) {
  return { ...metadata, reminderKey: key };
}

export function getRemindersForDefinition(
  tokens: readonly GameToken[],
  definition: ReminderDefinition,
) {
  return tokens
    .filter(
      (token) =>
        token.tokenType === "reminder" &&
        getReminderKey(token) === definition.key,
    )
    .sort((left, right) => left.position - right.position);
}

export function findReminderToRecycle(
  tokens: readonly GameToken[],
  definition: ReminderDefinition,
  targetSeatId: string,
) {
  const reminders = getRemindersForDefinition(tokens, definition);
  if (reminders.length < getReminderCopyLimit(definition)) return null;

  return (
    reminders.find((reminder) => reminder.seatId !== targetSeatId) ??
    reminders.find(
      (reminder) => readReminderPlacement(reminder).mode !== "anchored",
    ) ??
    null
  );
}

/**
 * Applies the physical reminder inventory to a full token collection.
 * Earlier tokens win so legacy over-supply is resolved deterministically.
 */
export function reconcileReminderInventory(tokens: readonly GameToken[]) {
  const placedByKey = new Map<string, number>();

  return tokens.flatMap((token): GameToken[] => {
    if (token.tokenType !== "reminder") return [token];

    const definition = getReminderDefinitionForToken(token);
    const placed = placedByKey.get(definition.key) ?? 0;
    if (placed >= getReminderCopyLimit(definition)) return [];
    placedByKey.set(definition.key, placed + 1);

    const storedKey = token.metadata.reminderKey;
    if (
      token.label === definition.label &&
      token.roleId === definition.roleId &&
      storedKey === definition.key
    ) {
      return [token];
    }

    return [
      {
        ...token,
        roleId: definition.roleId,
        label: definition.label,
        metadata: withReminderKey(token.metadata, definition.key),
      },
    ];
  });
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
