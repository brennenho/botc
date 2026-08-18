import { describe, expect, it, vi } from "vitest";

import {
  findKeyboardShortcut,
  formatKeyboardShortcut,
  getAdjacentSeatId,
  matchesKeyboardShortcut,
  type KeyboardShortcut,
} from "@/lib/keyboard-shortcuts";

function shortcut(overrides: Partial<KeyboardShortcut> = {}): KeyboardShortcut {
  return {
    id: "players",
    key: "p",
    onTrigger: vi.fn(),
    ...overrides,
  };
}

const event = {
  key: "p",
  shiftKey: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
};

describe("keyboard shortcuts", () => {
  it("matches keys case-insensitively with exact modifiers", () => {
    expect(matchesKeyboardShortcut(event, shortcut())).toBe(true);
    expect(matchesKeyboardShortcut({ ...event, key: "P" }, shortcut())).toBe(
      true,
    );
    expect(
      matchesKeyboardShortcut({ ...event, ctrlKey: true }, shortcut()),
    ).toBe(false);
    expect(
      matchesKeyboardShortcut(
        { ...event, key: "I", shiftKey: true },
        shortcut({ key: "i", shift: true }),
      ),
    ).toBe(true);
    expect(
      matchesKeyboardShortcut(
        { ...event, key: "/", shiftKey: true },
        shortcut({ key: "?", shift: true }),
      ),
    ).toBe(true);
  });

  it("skips disabled shortcuts", () => {
    const disabled = shortcut({ enabled: false });
    expect(findKeyboardShortcut(event, [disabled])).toBeUndefined();
  });

  it("cycles seats in seat order and wraps at either end", () => {
    const seats = [
      { id: "third", seatIndex: 2 },
      { id: "first", seatIndex: 0 },
      { id: "second", seatIndex: 1 },
    ];

    expect(getAdjacentSeatId(seats, null, 1)).toBe("first");
    expect(getAdjacentSeatId(seats, null, -1)).toBe("third");
    expect(getAdjacentSeatId(seats, "third", 1)).toBe("first");
    expect(getAdjacentSeatId(seats, "first", -1)).toBe("third");
  });

  it("formats compact keycap labels", () => {
    expect(formatKeyboardShortcut("Shift+I")).toBe("⇧I");
    expect(formatKeyboardShortcut("Escape")).toBe("Esc");
  });
});
