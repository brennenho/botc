type CapturedEvent = {
  properties: Record<string, unknown>;
};

const URL_PROPERTY_NAMES = [
  "$current_url",
  "$initial_current_url",
  "$pathname",
  "$prev_pageview_pathname",
  "$referrer",
  "$initial_referrer",
  "$session_entry_url",
] as const;

export function sanitizePath(pathname: string) {
  const segments = pathname.split("/");

  if (segments[1] === "game" && segments[2]) {
    segments[2] = "[code]";
  }

  if (segments[1] === "game" && segments[3] === "player" && segments[4]) {
    segments[4] = "[seatId]";
  }

  return segments.join("/") || "/";
}

export function sanitizeUrl(value: string) {
  const isAbsolute = /^[a-z][a-z\d+.-]*:\/\//i.test(value);

  try {
    const url = new URL(value, "https://analytics.invalid");
    const pathname = sanitizePath(url.pathname);
    return isAbsolute ? `${url.origin}${pathname}` : pathname;
  } catch {
    return sanitizePath(value.split(/[?#]/, 1)[0] ?? "/");
  }
}

export function sanitizeEvent<T extends CapturedEvent | null>(event: T): T {
  if (!event) return event;

  const properties = { ...event.properties };
  for (const propertyName of URL_PROPERTY_NAMES) {
    const value = properties[propertyName];
    if (typeof value === "string") {
      properties[propertyName] = sanitizeUrl(value);
    }
  }

  return { ...event, properties };
}
