import { cn } from "@/lib/utils";

export type PlayerPresenceStatus = "online" | "offline";

export function PlayerPresenceDot({
  status,
  className,
}: {
  status: PlayerPresenceStatus;
  className?: string;
}) {
  const label = status === "online" ? "Online" : "Disconnected";

  return (
    <span
      className={cn(
        "player-presence-dot",
        status === "online" && "is-online motion-safe:animate-pulse",
        status === "offline" && "is-offline",
        className,
      )}
      role="status"
      aria-label={label}
      title={label}
    />
  );
}
