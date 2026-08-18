export type KeyboardShortcut = {
  id: string;
  key: string;
  shift?: boolean;
  alt?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  enabled?: boolean;
  allowRepeat?: boolean;
  allowInModal?: boolean;
  onTrigger: () => void;
};

export type KeyboardShortcutEvent = Pick<
  KeyboardEvent,
  "key" | "shiftKey" | "altKey" | "ctrlKey" | "metaKey"
>;

export function matchesKeyboardShortcut(
  event: KeyboardShortcutEvent,
  shortcut: KeyboardShortcut,
) {
  const eventKey = event.key.toLocaleLowerCase();
  const shortcutKey = shortcut.key.toLocaleLowerCase();
  const keyMatches =
    eventKey === shortcutKey ||
    (shortcutKey === "?" && event.shiftKey && eventKey === "/");

  return (
    keyMatches &&
    event.shiftKey === Boolean(shortcut.shift) &&
    event.altKey === Boolean(shortcut.alt) &&
    event.ctrlKey === Boolean(shortcut.ctrl) &&
    event.metaKey === Boolean(shortcut.meta)
  );
}

export function findKeyboardShortcut(
  event: KeyboardShortcutEvent,
  shortcuts: readonly KeyboardShortcut[],
) {
  return shortcuts.find(
    (shortcut) =>
      shortcut.enabled !== false && matchesKeyboardShortcut(event, shortcut),
  );
}

export function isEditableKeyboardShortcutTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"]'),
  );
}

export function isKeyboardShortcutModalTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest("[data-keyboard-shortcuts-modal]"))
  );
}

export function getAdjacentSeatId(
  seats: readonly { id: string; seatIndex: number }[],
  selectedSeatId: string | null,
  direction: -1 | 1,
) {
  if (seats.length === 0) return null;

  const orderedSeats = [...seats].sort(
    (first, second) => first.seatIndex - second.seatIndex,
  );
  const selectedIndex = orderedSeats.findIndex(
    (seat) => seat.id === selectedSeatId,
  );
  const startIndex =
    selectedIndex === -1 ? (direction === 1 ? -1 : 0) : selectedIndex;
  const nextIndex =
    (startIndex + direction + orderedSeats.length) % orderedSeats.length;

  return orderedSeats[nextIndex]?.id ?? null;
}

export function formatKeyboardShortcut(shortcut: string) {
  return shortcut
    .split("+")
    .map((part) => {
      if (part === "Shift") return "⇧";
      if (part === "Escape") return "Esc";
      return part;
    })
    .join("");
}
