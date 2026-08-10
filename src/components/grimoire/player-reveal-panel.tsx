"use client";

import { InformationTokenIcon } from "@/components/grimoire/information-token-icon";
import { Button } from "@/components/ui/button";
import { roleById } from "@/lib/game-data";
import type { GameToken, Seat } from "@/lib/game-data/types";
import type { PlayerReveal } from "@/lib/player-reveal";
import { cn } from "@/lib/utils";

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
      <RevealSection title="Information Tokens" className="is-token-board">
        <RevealAction
          icon={<InformationTokenIcon type="you-are" />}
          title="You Are"
          layout="tile"
          onClick={() => onChooseRole("You Are")}
        />
        <RevealAction
          icon={<InformationTokenIcon type="this-player-is" />}
          title="This Player Is"
          layout="tile"
          onClick={() => onChooseRole("This Player Is")}
        />
        <RevealAction
          icon={<InformationTokenIcon type="selected-you" />}
          title="Selected You"
          layout="tile"
          wide
          onClick={() => onChooseRole("This Character Selected You")}
        />
        <RevealAction
          icon={<InformationTokenIcon type="did-vote" />}
          title="Did You Vote Today?"
          layout="tile"
          onClick={() =>
            onReveal({ type: "question", question: "Did You Vote Today?" })
          }
        />
        <RevealAction
          icon={<InformationTokenIcon type="did-nominate" />}
          title="Did You Nominate Today?"
          layout="tile"
          onClick={() =>
            onReveal({
              type: "question",
              question: "Did You Nominate Today?",
            })
          }
        />
        <RevealAction
          icon={<InformationTokenIcon type="good" />}
          title="You Are Good"
          layout="tile"
          tone="good"
          onClick={() => onReveal({ type: "alignment", alignment: "good" })}
        />
        <RevealAction
          icon={<InformationTokenIcon type="evil" />}
          title="You Are Evil"
          layout="tile"
          tone="evil"
          onClick={() => onReveal({ type: "alignment", alignment: "evil" })}
        />
      </RevealSection>

      <RevealSection title="Setup Info" className="is-setup-board">
        <RevealAction
          icon={<InformationTokenIcon type="demon" />}
          title="Demon Information"
          description={
            demon
              ? `${minionCount} ${minionCount === 1 ? "Minion" : "Minions"} · ${bluffCount} of 3 Bluffs Set`
              : "Assign a Demon to Enable"
          }
          disabled={!demon}
          layout="tile"
          onClick={() => onReveal({ type: "demon-information" })}
        />
        <RevealAction
          icon={<InformationTokenIcon type="minions" />}
          title="Minion Information"
          description={
            !demon
              ? "Assign a Demon to Enable"
              : minionCount === 0
                ? "Assign a Minion to Enable"
                : `${minionCount} ${minionCount === 1 ? "Minion" : "Minions"} · Demon: ${demon.playerName}`
          }
          disabled={!demon || minionCount === 0}
          layout="tile"
          onClick={() => onReveal({ type: "minion-information" })}
        />
        <RevealAction
          icon={<InformationTokenIcon type="bluffs" />}
          title="Demon Bluffs"
          description={`${bluffCount} of 3 Bluffs Set`}
          disabled={bluffCount === 0}
          layout="tile"
          onClick={() => onReveal({ type: "demon-bluffs" })}
        />
      </RevealSection>
    </div>
  );
}

function RevealSection({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("player-reveal-panel-section", className)}>
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
  layout = "row",
  tone,
  wide,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  disabled?: boolean;
  layout?: "row" | "tile";
  tone?: "good" | "evil";
  wide?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="quiet"
      focusStyle="surface"
      className="player-reveal-action"
      data-layout={layout}
      data-tone={tone}
      data-wide={wide ? true : undefined}
      disabled={disabled}
      aria-label={description ? `${title}: ${description}` : title}
      onClick={onClick}
    >
      <span className="player-reveal-action-icon">{icon}</span>
      <span className="player-reveal-action-copy">
        <strong>{title}</strong>
        {description ? <small>{description}</small> : null}
      </span>
    </Button>
  );
}
