"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useRef } from "react";

import { IconButton } from "@/components/ui/icon-button";
import { ShortcutKey } from "@/components/ui/shortcut-key";

type ActorRole = "storyteller" | "player";

type ShortcutGroup = {
  title: string;
  shortcuts: { label: string; keys: string[] }[];
};

const sharedGroups: ShortcutGroup[] = [
  {
    title: "Anywhere",
    shortcuts: [
      { label: "Shortcut guide", keys: ["H"] },
      { label: "Invite players", keys: ["V"] },
      { label: "Toggle redaction", keys: ["R"] },
      { label: "Close or cancel", keys: ["Escape"] },
    ],
  },
];

const storytellerGroups: ShortcutGroup[] = [
  {
    title: "Open a panel",
    shortcuts: [
      { label: "Players", keys: ["P"] },
      { label: "Night order", keys: ["N"] },
      { label: "Player information", keys: ["I"] },
      { label: "Script reference", keys: ["S"] },
    ],
  },
  {
    title: "Player selected",
    shortcuts: [
      { label: "Previous or next player", keys: ["[", "]"] },
      { label: "Choose character", keys: ["C"] },
      { label: "Rename", keys: ["E"] },
      { label: "Add reminder", keys: ["M"] },
      { label: "Toggle alive or dead", keys: ["D"] },
      { label: "Toggle alignment", keys: ["A"] },
      { label: "Toggle ghost vote", keys: ["G"] },
      { label: "Toggle Traveller", keys: ["T"] },
    ],
  },
];

const playerGroups: ShortcutGroup[] = [
  {
    title: "Grimoire",
    shortcuts: [{ label: "Script reference", keys: ["S"] }],
  },
];

export function KeyboardShortcutsDialog({
  actorRole,
  open,
  onOpenChange,
}: {
  actorRole: ActorRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const groups = [
    ...sharedGroups,
    ...(actorRole === "storyteller" ? storytellerGroups : playerGroups),
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop shortcut-dialog-backdrop" />
        <Dialog.Viewport className="dialog-viewport shortcut-dialog-viewport">
          <Dialog.Popup
            className="shortcut-card"
            initialFocus={titleRef}
            data-keyboard-shortcuts-modal
          >
            <header className="shortcut-card-header">
              <Dialog.Title ref={titleRef} tabIndex={-1}>
                Shortcut guide
              </Dialog.Title>
              <Dialog.Close
                render={
                  <IconButton
                    label="Close keyboard shortcuts"
                    variant="quiet"
                    tooltip={false}
                    className="shortcut-card-close"
                  >
                    <X className="size-4" />
                  </IconButton>
                }
              />
            </header>

            <Dialog.Description className="shortcut-card-description">
              Press a key anywhere in the grimoire. Shortcuts pause while you
              type or use a dialog.
            </Dialog.Description>

            <div className="shortcut-groups">
              {groups.map((group) => (
                <section
                  key={group.title}
                  className={`shortcut-group${group.title === "Player selected" ? "is-wide" : ""}`}
                >
                  <h3>{group.title}</h3>
                  <dl>
                    {group.shortcuts.map((shortcut) => (
                      <div key={shortcut.label} className="shortcut-row">
                        <dt>{shortcut.label}</dt>
                        <dd>
                          {shortcut.keys.map((key, index) => (
                            <span key={key}>
                              {index > 0 ? (
                                <span className="shortcut-key-separator">
                                  or
                                </span>
                              ) : null}
                              <ShortcutKey shortcut={key} />
                            </span>
                          ))}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
