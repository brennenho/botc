import { describe, expect, it } from "vitest";

import {
  getNightOrderEntries,
  roleById,
  roles,
  type Role,
} from "@/lib/game-data";
import { getNightReminderPlan } from "@/lib/game-data/night-reminder-actions";
import type { GameToken } from "@/lib/game-data/types";
import {
  getDefaultPlayerPosition,
  getReminderPosition,
  readReminderPlacement,
  withReminderPlacement,
} from "@/lib/grimoire-canvas";
import {
  findReminderSnapTarget,
  getPlayerLabelSide,
  getReminderSlotPositions,
} from "@/lib/reminder-layout";
import {
  getAnchoredReminders,
  getReminderDefinition,
  getReminderKey,
  reconcileReminderInventory,
  updateReminderPlacement,
  withReminderKey,
} from "@/lib/reminders";

const boardSize = { width: 1200, height: 800 };
const layoutOptions = {
  boardSize,
  playerSize: 100,
  reminderSize: 68,
  clearance: 10,
  gap: 8,
};

function reminder(id: string, seatId: string, order: number): GameToken {
  return {
    id,
    seatId,
    tokenType: "reminder",
    roleId: "poisoner",
    label: "Poisoned",
    position: order,
    metadata: withReminderPlacement({}, { mode: "anchored", order }),
  };
}

describe("reminder layout", () => {
  it("keeps the top and bottom seats clear of outward-facing labels", () => {
    const positions = Array.from({ length: 8 }, (_, index) =>
      getDefaultPlayerPosition(index, 8),
    );

    expect(Math.min(...positions.map(({ y }) => y))).toBeGreaterThanOrEqual(15);
    expect(Math.max(...positions.map(({ y }) => y))).toBeLessThanOrEqual(79);
  });

  it("centers reminders below a top seat toward the grimoire center", () => {
    const [slot] = getReminderSlotPositions({
      playerPosition: { x: 50, y: 12 },
      count: 1,
      ...layoutOptions,
    });

    expect(slot).toBeDefined();
    expect(slot?.x).toBeCloseTo(50);
    expect(slot?.y).toBeGreaterThan(12);
  });

  it("places the player identity opposite the inward reminder arc", () => {
    expect(
      getPlayerLabelSide({
        playerPosition: { x: 50, y: 12 },
      }),
    ).toBe("top");
    expect(
      getPlayerLabelSide({
        playerPosition: { x: 88, y: 50 },
      }),
    ).toBe("bottom");
  });

  it("curves reminders inward on compact rings without overlapping", () => {
    const playerPosition = { x: 88, y: 50 };
    const slots = getReminderSlotPositions({
      playerPosition,
      count: 6,
      ...layoutOptions,
    });
    const playerDistance = Math.hypot(
      ((playerPosition.x - 50) / 100) * boardSize.width,
      ((playerPosition.y - 50) / 100) * boardSize.height,
    );

    expect(slots).toHaveLength(6);
    const radii = slots.map((slot) =>
      Math.hypot(
        ((slot.x - playerPosition.x) / 100) * boardSize.width,
        ((slot.y - playerPosition.y) / 100) * boardSize.height,
      ),
    );
    expect(new Set(radii.map(Math.round)).size).toBe(2);
    expect(Math.max(...radii) - Math.min(...radii)).toBeCloseTo(
      layoutOptions.reminderSize + layoutOptions.gap,
    );

    for (const slot of slots) {
      const slotDistance = Math.hypot(
        ((slot.x - 50) / 100) * boardSize.width,
        ((slot.y - 50) / 100) * boardSize.height,
      );
      expect(slotDistance).toBeLessThan(playerDistance);
    }

    for (const [index, slot] of slots.entries()) {
      for (const other of slots.slice(index + 1)) {
        const distance = Math.hypot(
          ((slot.x - other.x) / 100) * boardSize.width,
          ((slot.y - other.y) / 100) * boardSize.height,
        );
        expect(distance).toBeGreaterThanOrEqual(layoutOptions.reminderSize);
      }
    }
  });

  it("snaps near a player and stays free outside the capture radius", () => {
    const players = [
      {
        seatId: "seat-a",
        position: { x: 88, y: 50 },
        anchoredReminderCount: 2,
      },
    ];
    const snapped = findReminderSnapTarget({
      dropPosition: { x: 81, y: 50 },
      players,
      ...layoutOptions,
    });
    const free = findReminderSnapTarget({
      dropPosition: { x: 50, y: 50 },
      players,
      ...layoutOptions,
    });

    expect(snapped?.seatId).toBe("seat-a");
    expect(snapped?.order).toBeGreaterThanOrEqual(0);
    expect(free).toBeNull();
  });
});

describe("reminder placement metadata", () => {
  it("transfers an anchored reminder and normalizes both player stacks", () => {
    const tokens = [
      reminder("a", "seat-a", 0),
      reminder("b", "seat-a", 1),
      reminder("c", "seat-b", 0),
    ];
    const updated = updateReminderPlacement(
      tokens,
      "a",
      { mode: "anchored", order: 1 },
      "seat-b",
    );

    expect(
      getAnchoredReminders(updated, "seat-a").map((token) => token.id),
    ).toEqual(["b"]);
    expect(
      getAnchoredReminders(updated, "seat-b").map((token) => token.id),
    ).toEqual(["c", "a"]);
    expect(
      readReminderPlacement(updated.find((token) => token.id === "b")!),
    ).toEqual({
      mode: "anchored",
      order: 0,
    });
  });

  it("keeps ownership while persisting a free canvas position", () => {
    const updated = updateReminderPlacement([reminder("a", "seat-a", 0)], "a", {
      mode: "free",
      canvasPosition: { x: 47.5, y: 62 },
    });
    const token = updated[0]!;

    expect(token.seatId).toBe("seat-a");
    expect(getReminderPosition(token)).toEqual({ x: 47.5, y: 62 });
  });

  it("reads legacy canvas positions as free placement", () => {
    const token = reminder("a", "seat-a", 0);
    token.metadata = { canvasPosition: { x: 22, y: 31 } };

    expect(readReminderPlacement(token)).toEqual({
      mode: "free",
      canvasPosition: { x: 22, y: 31 },
    });
  });
});

describe("physical reminder inventory", () => {
  it("defaults an unknown reminder to one physical copy", () => {
    expect(getReminderDefinition(null, "Custom").copies).toBe(1);
  });

  it("keeps only the available copies while preserving different sources", () => {
    const innkeeper = roleById.get("innkeeper")!;
    const safe = getReminderDefinition(innkeeper, "Safe");
    const poisonerPoisoned = getReminderDefinition(
      roleById.get("poisoner")!,
      "Poisoned",
    );
    const pukkaPoisoned = getReminderDefinition(
      roleById.get("pukka")!,
      "Poisoned",
    );
    const tokens: GameToken[] = [
      ...["safe-a", "safe-b", "safe-extra"].map(
        (id, position): GameToken => ({
          id,
          seatId: "seat-a",
          tokenType: "reminder",
          roleId: innkeeper.id,
          label: safe.label,
          position,
          metadata: withReminderKey({}, safe.key),
        }),
      ),
      {
        id: "poisoner",
        seatId: "seat-a",
        tokenType: "reminder",
        roleId: poisonerPoisoned.roleId,
        label: poisonerPoisoned.label,
        position: 3,
        metadata: withReminderKey({}, poisonerPoisoned.key),
      },
      {
        id: "pukka",
        seatId: "seat-b",
        tokenType: "reminder",
        roleId: pukkaPoisoned.roleId,
        label: pukkaPoisoned.label,
        position: 4,
        metadata: withReminderKey({}, pukkaPoisoned.key),
      },
    ];

    const reconciled = reconcileReminderInventory(tokens);

    expect(safe.copies).toBe(2);
    expect(
      reconciled
        .filter((token) => getReminderKey(token) === safe.key)
        .map((token) => token.id),
    ).toEqual(["safe-a", "safe-b"]);
    expect(reconciled.map((token) => token.id)).toContain("poisoner");
    expect(reconciled.map((token) => token.id)).toContain("pukka");
  });

  it("canonicalizes legacy physical labels and stored keys", () => {
    const token: GameToken = {
      id: "town-crier",
      seatId: "seat-a",
      tokenType: "reminder",
      roleId: "towncrier",
      label: "Minions Not Nominated",
      position: 0,
      metadata: { reminderKey: "legacy-key" },
    };

    const [reconciled] = reconcileReminderInventory([token]);

    expect(reconciled).toMatchObject({
      label: "Minion Not Nominated",
      metadata: {
        reminderKey: "role:towncrier:minion-not-nominated",
      },
    });
  });
});

describe("night reminder guidance", () => {
  const nightFields: ["first" | "other", keyof Role][] = [
    ["first", "firstNightReminder"],
    ["other", "otherNightReminder"],
  ];

  it("covers every official reminder placeholder with real token labels", () => {
    for (const role of roles) {
      for (const [night, field] of nightFields) {
        const text = role[field];
        if (typeof text !== "string" || !text.includes(":reminder:")) continue;

        const plan = getNightReminderPlan(role.id, night);
        expect(plan, `${role.name} ${night} night`).not.toBeNull();
        expect(
          plan?.actions.length,
          `${role.name} ${night} night`,
        ).toBeGreaterThan(0);
        for (const action of plan?.actions ?? []) {
          expect(role.reminders, `${role.name}: ${action.label}`).toContain(
            action.label,
          );
        }
      }
    }
  });

  it("never exposes placeholder markup in the rendered night order", () => {
    for (const edition of ["tb", "bmr", "snv"] as const) {
      for (const night of ["first", "other"] as const) {
        for (const entry of getNightOrderEntries(edition, night)) {
          expect(entry.reminder).not.toContain(":reminder:");
          if (entry.role) expect(roleById.get(entry.role.id)).toBe(entry.role);
        }
      }
    }
  });
});
