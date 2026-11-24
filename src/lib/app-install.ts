type InstallPrompt = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let pendingPrompt: InstallPrompt | null = null;
let installed = false;
const changes = new EventTarget();

function notifyChange() {
  changes.dispatchEvent(new Event("change"));
}

// The browser can offer installation before the homepage hydrates or while
// another route is open. Keep the one-use prompt for the next install click.
export function initializeAppInstall() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    pendingPrompt = event as InstallPrompt;
    installed = false;
    notifyChange();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    pendingPrompt = null;
    notifyChange();
  });
  window
    .matchMedia("(display-mode: standalone)")
    .addEventListener("change", notifyChange);
}

export function subscribeToInstall(onChange: () => void) {
  changes.addEventListener("change", onChange);
  return () => changes.removeEventListener("change", onChange);
}

export type InstallGuide =
  "ios" | "ios-chrome" | "macos" | "android" | "edge" | "chrome";

export function getInstallOption(): InstallGuide | "native" | null {
  const nav = navigator as Navigator & { standalone?: boolean };
  if (
    !window.isSecureContext ||
    installed ||
    nav.standalone ||
    window.matchMedia("(display-mode: standalone)").matches
  ) {
    return null;
  }
  if (pendingPrompt) return "native";

  const agent = nav.userAgent;
  if (
    /iPhone|iPad|iPod/.test(agent) ||
    (agent.includes("Macintosh") && nav.maxTouchPoints > 1)
  ) {
    return agent.includes("CriOS/") ? "ios-chrome" : "ios";
  }
  const safariVersion = /Macintosh.*Version\/(\d+).*Safari\//.exec(agent);
  if (safariVersion && Number(safariVersion[1]) >= 17) {
    return "macos";
  }
  if ("onbeforeinstallprompt" in window) {
    if (agent.includes("Android")) return "android";
    if (agent.includes("Edg/")) return "edge";
    if (agent.includes("Chrome/")) return "chrome";
  }
  return null;
}

export async function promptToInstall() {
  const event = pendingPrompt;
  if (!event) return;
  pendingPrompt = null;
  try {
    await event.prompt();
    if ((await event.userChoice).outcome === "accepted") installed = true;
  } finally {
    notifyChange();
  }
}
