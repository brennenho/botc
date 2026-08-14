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
        status === "online" && "is-online",
        status === "offline" && "is-offline",
        className,
      )}
      role="status"
      aria-label={label}
      title={label}
    >
      {status === "online" && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-75 motion-safe:animate-[ping_1.5s_ease-in-out_infinite]" />
      )}
      <span className="relative inline-flex h-full w-full rounded-full bg-current" />
    </span>
  );
}
