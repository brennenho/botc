"use client";

import { Download } from "lucide-react";
import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { ParchmentDialog } from "@/components/ui/parchment-dialog";
import {
  getInstallOption,
  promptToInstall,
  subscribeToInstall,
  type InstallGuide,
} from "@/lib/app-install";
import { notify } from "@/lib/notifications";

const confirmHomeScreen = (
  <li>
    Turn on <strong>Open as Web App</strong> if shown, then tap{" "}
    <strong>Add</strong>.
  </li>
);

const installSteps: Record<InstallGuide, ReactNode> = {
  ios: (
    <>
      <li>
        Open <strong>Share</strong> and choose{" "}
        <strong>Add to Home Screen</strong>.
      </li>
      {confirmHomeScreen}
    </>
  ),
  "ios-chrome": (
    <>
      <li>
        Tap <strong>Share</strong> beside Chrome’s address bar, then choose{" "}
        <strong>Add to Home Screen</strong>.
      </li>
      {confirmHomeScreen}
    </>
  ),
  macos: (
    <>
      <li>
        In Safari on macOS Sonoma or later, click <strong>Share</strong>.
      </li>
      <li>
        Choose <strong>Add to Dock</strong>, then click <strong>Add</strong>.
      </li>
    </>
  ),
  android: (
    <>
      <li>Open your browser’s menu.</li>
      <li>
        Choose <strong>Install app</strong> or{" "}
        <strong>Add to Home screen</strong> and follow the prompts.
      </li>
    </>
  ),
  edge: (
    <>
      <li>
        In the Edge menu, open <strong>More tools</strong>, then{" "}
        <strong>Apps</strong>.
      </li>
      <li>
        Choose <strong>Install this site as an app</strong>.
      </li>
    </>
  ),
  chrome: (
    <>
      <li>
        From Chrome’s menu, choose <strong>Cast, save, and share</strong>.
      </li>
      <li>
        Select <strong>Install page as app</strong> and confirm.
      </li>
    </>
  ),
};

export function InstallAppButton() {
  const option = useSyncExternalStore(
    subscribeToInstall,
    getInstallOption,
    () => null,
  );
  const [guide, setGuide] = useState<InstallGuide | null>(null);
  const [prompting, setPrompting] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  if (!option) return null;

  async function handleClick() {
    if (option !== "native") {
      setGuide(option);
      return;
    }
    setPrompting(true);
    try {
      await promptToInstall();
    } catch {
      notify.error("Couldn’t open the install prompt. Try the browser menu.");
    } finally {
      setPrompting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="entry-install-button"
        disabled={prompting}
        aria-haspopup={option === "native" ? undefined : "dialog"}
        onClick={handleClick}
      >
        <Download aria-hidden="true" />
        Install app
      </button>
      <ParchmentDialog
        open={guide !== null}
        onOpenChange={(open) => {
          if (!open) setGuide(null);
        }}
        title="Install app"
        description="Save this website as an app on your device."
        closeLabel="Close install instructions"
        finalFocus={triggerRef}
        size="sm"
      >
        {guide && <ol className="install-steps">{installSteps[guide]}</ol>}
      </ParchmentDialog>
    </>
  );
}
