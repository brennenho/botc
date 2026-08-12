import { EyeOff, Skull, Vote } from "lucide-react";

import { CharacterToken } from "@/components/grimoire/character-token";
import type { Role, Seat } from "@/lib/game-data/types";
import { teamLabel } from "@/lib/game-data";
import { cn } from "@/lib/utils";

export function PlayerRoleCard({
  role,
  seat,
  redacted,
}: {
  role: Role | null;
  seat: Seat;
  redacted: boolean;
}) {
  return (
    <aside
      className={cn("player-private-role", redacted && "is-redacted")}
      aria-label="Your Character"
    >
      <div className="player-private-role-token-slot">
        {redacted ? (
          <span className="player-private-role-redacted" aria-hidden="true">
            <EyeOff />
          </span>
        ) : role ? (
          <CharacterToken
            role={role}
            size="sm"
            appearance="bare"
            className="player-private-role-token"
          />
        ) : (
          <span className="player-private-role-empty" aria-hidden="true">
            <EyeOff />
          </span>
        )}
      </div>

      <div className="player-private-role-content">
        <div className="player-private-role-summary">
          <div className="player-private-role-copy">
            <span className="utility-label">
              {redacted ? "Privacy Mode" : "Your Character"}
            </span>
            <strong>
              {redacted ? "Screen Redacted" : (role?.name ?? "Not Assigned")}
            </strong>
            {!redacted && role ? (
              <span className="player-private-role-meta">
                {teamLabel(role.team)} ·{" "}
                {seat.alignment === "good" ? "Good" : "Evil"}
              </span>
            ) : null}
          </div>

          {!redacted ? <PlayerStatus seat={seat} /> : null}
        </div>

        <p className="player-private-role-ability">
          {redacted
            ? "Your private game information is hidden."
            : role
              ? role.ability
              : "Waiting for the Storyteller to assign your character."}
        </p>
      </div>
    </aside>
  );
}

function PlayerStatus({ seat }: { seat: Seat }) {
  return (
    <div className="player-private-status" aria-label="Your Status">
      <span>
        {seat.alive ? (
          <Vote aria-hidden="true" />
        ) : (
          <Skull aria-hidden="true" />
        )}
        {seat.alive ? "Alive" : "Dead"}
      </span>
      {!seat.alive ? (
        <span>
          <Vote aria-hidden="true" />
          {seat.ghostVoteAvailable ? "Vote Available" : "Vote Used"}
        </span>
      ) : null}
    </div>
  );
}
