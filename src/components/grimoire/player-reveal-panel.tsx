"use client";

import {
  BadgeCheck,
  BookOpen,
  Flame,
  ShieldCheck,
  UserRoundCheck,
  Users,
} from "lucide-react";

import { RevealIcon } from "@/components/grimoire/reveal-icon";
import { Button } from "@/components/ui/button";
import { roleById } from "@/lib/game-data";
import type { GameToken, Seat } from "@/lib/game-data/types";
import type { PlayerReveal } from "@/lib/player-reveal";

export function PlayerRevealPanel({
  seats,
  gameTokens,
  onReveal,
  onChooseRole,
}: {
  seats: Seat[];
  gameTokens: GameToken[];
  onReveal: (reveal: PlayerReveal) => void;
  onChooseRole: (heading: string) => void;
}) {
  const minionCount = seats.filter(
    (seat) => seat.roleId && roleById.get(seat.roleId)?.team === "minion",
  ).length;
  const demon = seats.find(
    (seat) => seat.roleId && roleById.get(seat.roleId)?.team === "demon",
  );
  const bluffCount = gameTokens.filter(
    (token) => token.tokenType === "bluff" && token.roleId,
  ).length;

  return (
    <div className="player-reveal-panel">
      <RevealSection title="Game Information">
        <RevealAction
          icon={<Users />}
          title="Demon Information"
          description={
            demon
              ? `${minionCount} ${minionCount === 1 ? "Minion" : "Minions"} · ${bluffCount} of 3 Bluffs`
              : "Assign a Demon First"
          }
          disabled={!demon}
          onClick={() => onReveal({ type: "demon-information" })}
        />
        <RevealAction
          icon={<UserRoundCheck />}
          title="Minion Information"
          description={
            !demon
              ? "Assign a Demon First"
              : minionCount === 0
                ? "Assign a Minion First"
                : `Demon: ${demon.playerName} · ${minionCount} ${minionCount === 1 ? "Minion" : "Minions"}`
          }
          disabled={!demon || minionCount === 0}
          onClick={() => onReveal({ type: "minion-information" })}
        />
        <RevealAction
          icon={<BookOpen />}
          title="Demon Bluffs"
          description={`${bluffCount} of 3 Bluffs Set`}
          disabled={bluffCount === 0}
          onClick={() => onReveal({ type: "demon-bluffs" })}
        />
      </RevealSection>

      <RevealSection title="Information Tokens">
        <RevealAction
          icon={<BadgeCheck />}
          title="You Are"
          description="Show a Character"
          onClick={() => onChooseRole("You Are")}
        />
        <RevealAction
          icon={<UserRoundCheck />}
          title="This Character Selected You"
          description="Show the Selecting Character"
          onClick={() => onChooseRole("This Character Selected You")}
        />
        <RevealAction
          icon={<BookOpen />}
          title="This Player Is"
          description="Show a Character, Then Point to a Player"
          onClick={() => onChooseRole("This Player Is")}
        />
      </RevealSection>

      <RevealSection title="Alignment">
        <div className="player-reveal-alignment-actions">
          <RevealAction
            icon={<ShieldCheck />}
            title="You Are Good"
            tone="good"
            onClick={() => onReveal({ type: "alignment", alignment: "good" })}
          />
          <RevealAction
            icon={<Flame />}
            title="You Are Evil"
            tone="evil"
            onClick={() => onReveal({ type: "alignment", alignment: "evil" })}
          />
        </div>
      </RevealSection>
    </div>
  );
}

function RevealSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="player-reveal-panel-section">
      <h3 className="utility-label">{title}</h3>
      <div className="player-reveal-action-list">{children}</div>
    </section>
  );
}

function RevealAction({
  icon,
  title,
  description,
  disabled,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  disabled?: boolean;
  tone?: "good" | "evil";
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="quiet"
      focusStyle="surface"
      className="player-reveal-action"
      data-tone={tone}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="player-reveal-action-icon">{icon}</span>
      <span className="player-reveal-action-copy">
        <strong>{title}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <span className="player-reveal-action-command">
        <RevealIcon />
        Show
      </span>
    </Button>
  );
}
