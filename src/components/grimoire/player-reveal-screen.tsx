"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CharacterToken } from "@/components/grimoire/character-token";
import { InformationTokenIcon } from "@/components/grimoire/information-token-icon";
import { Button } from "@/components/ui/button";
import { roleById, teamLabel } from "@/lib/game-data";
import type { GameToken, Seat } from "@/lib/game-data/types";
import type { PlayerReveal } from "@/lib/player-reveal";
import { cn } from "@/lib/utils";

export function PlayerRevealScreen({
  reveal,
  seats,
  gameTokens,
  onClose,
}: {
  reveal: PlayerReveal | null;
  seats: Seat[];
  gameTokens: GameToken[];
  onClose: () => void;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  return (
    <Dialog.Root open={reveal !== null} modal onOpenChange={() => undefined}>
      <Dialog.Portal>
        <Dialog.Viewport className="player-reveal-viewport">
          {reveal ? (
            <Dialog.Popup
              className="player-reveal-screen"
              initialFocus={titleRef}
            >
              <RevealContent
                reveal={reveal}
                seats={seats}
                gameTokens={gameTokens}
                titleRef={titleRef}
              />
              <SafeReturnButton onReturn={onClose} />
            </Dialog.Popup>
          ) : null}
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function RevealContent({
  reveal,
  seats,
  gameTokens,
  titleRef,
}: {
  reveal: PlayerReveal;
  seats: Seat[];
  gameTokens: GameToken[];
  titleRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const bluffs = gameTokens
    .filter((token) => token.tokenType === "bluff" && token.roleId)
    .sort((a, b) => a.position - b.position)
    .flatMap((token) => {
      const role = token.roleId ? roleById.get(token.roleId) : null;
      return role ? [role] : [];
    });
  const minions = seats.filter(
    (seat) => seat.roleId && roleById.get(seat.roleId)?.team === "minion",
  );
  const demon = seats.find(
    (seat) => seat.roleId && roleById.get(seat.roleId)?.team === "demon",
  );

  if (reveal.type === "role") {
    const role = roleById.get(reveal.roleId);
    if (!role) return null;
    return (
      <main className="player-reveal-content is-role">
        <Dialog.Title
          ref={titleRef}
          tabIndex={-1}
          className="player-reveal-title"
        >
          {reveal.heading}
        </Dialog.Title>
        <div className="player-reveal-primary-role">
          <CharacterToken
            role={role}
            size="fill"
            appearance="parchment"
            className="player-reveal-primary-token"
            priority
            imageSizes="190px"
          />
          <h2>{role.name}</h2>
          <p className={cn("player-reveal-team", `team-${role.team}`)}>
            {teamLabel(role.team)}
          </p>
          <p className="player-reveal-ability">{role.ability}</p>
        </div>
      </main>
    );
  }

  if (reveal.type === "alignment") {
    const good = reveal.alignment === "good";
    return (
      <main className="player-reveal-content is-alignment">
        <Dialog.Title
          ref={titleRef}
          tabIndex={-1}
          className="player-reveal-title"
        >
          You Are
        </Dialog.Title>
        <div
          className={cn(
            "player-reveal-alignment",
            good ? "is-good" : "is-evil",
          )}
        >
          <InformationTokenIcon type={good ? "good" : "evil"} />
          <strong>{good ? "Good" : "Evil"}</strong>
        </div>
      </main>
    );
  }

  if (reveal.type === "question") {
    const isVoteQuestion = reveal.question === "Did You Vote Today?";
    return (
      <main className="player-reveal-content is-question">
        <span className="player-reveal-question-icon" aria-hidden="true">
          <InformationTokenIcon
            type={isVoteQuestion ? "did-vote" : "did-nominate"}
          />
        </span>
        <Dialog.Title
          ref={titleRef}
          tabIndex={-1}
          className="player-reveal-title"
        >
          {reveal.question}
        </Dialog.Title>
        <p className="player-reveal-question-response">
          Nod for Yes <span aria-hidden="true">·</span> Shake Your Head for No
        </p>
      </main>
    );
  }

  if (reveal.type === "minion-information") {
    return (
      <main className="player-reveal-content is-group-information">
        <section className="player-reveal-information-section">
          <Dialog.Title
            ref={titleRef}
            tabIndex={-1}
            className="player-reveal-title"
          >
            This Is the Demon
          </Dialog.Title>
          <p className="player-reveal-player-name">
            {demon?.playerName ?? "No Demon Assigned"}
          </p>
        </section>
        <section className="player-reveal-information-section">
          <h2 className="player-reveal-title">These Are the Minions</h2>
          <RevealPlayerList seats={minions} emptyLabel="No Minions Assigned" />
        </section>
      </main>
    );
  }

  if (reveal.type === "demon-bluffs") {
    return (
      <main className="player-reveal-content is-bluffs">
        <Dialog.Title
          ref={titleRef}
          tabIndex={-1}
          className="player-reveal-title"
        >
          These Characters Are Not in Play
        </Dialog.Title>
        <RevealRoleList roles={bluffs} emptyLabel="No Demon Bluffs Set" />
      </main>
    );
  }

  return (
    <main className="player-reveal-content is-group-information">
      <section className="player-reveal-information-section">
        <Dialog.Title
          ref={titleRef}
          tabIndex={-1}
          className="player-reveal-title"
        >
          Your Minions
        </Dialog.Title>
        <RevealPlayerList seats={minions} emptyLabel="No Minions Assigned" />
      </section>
      <section className="player-reveal-information-section">
        <h2 className="player-reveal-title">
          These Characters Are Not in Play
        </h2>
        <RevealRoleList roles={bluffs} emptyLabel="No Demon Bluffs Set" />
      </section>
    </main>
  );
}

function RevealPlayerList({
  seats,
  emptyLabel,
}: {
  seats: Seat[];
  emptyLabel: string;
}) {
  return (
    <div className="player-reveal-player-list">
      {seats.length > 0 ? (
        seats.map((seat) => <strong key={seat.id}>{seat.playerName}</strong>)
      ) : (
        <span>{emptyLabel}</span>
      )}
    </div>
  );
}

function RevealRoleList({
  roles,
  emptyLabel,
}: {
  roles: NonNullable<ReturnType<typeof roleById.get>>[];
  emptyLabel: string;
}) {
  if (roles.length === 0) {
    return <p className="player-reveal-empty">{emptyLabel}</p>;
  }

  return (
    <div className="player-reveal-role-list">
      {roles.map((role) => (
        <div key={role.id} className="player-reveal-role-item">
          <CharacterToken
            role={role}
            size="fill"
            appearance="parchment"
            className="player-reveal-role-token"
            priority
            imageSizes="150px"
          />
          <strong>{role.name}</strong>
        </div>
      ))}
    </div>
  );
}

function SafeReturnButton({ onReturn }: { onReturn: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  function handleClick() {
    if (confirming) {
      onReturn();
      return;
    }

    setConfirming(true);
    resetTimer.current = window.setTimeout(() => {
      setConfirming(false);
      resetTimer.current = null;
    }, 2500);
  }

  return (
    <Button
      type="button"
      variant="quiet"
      className={cn("player-reveal-return", confirming && "is-confirming")}
      onClick={handleClick}
    >
      <Undo2 />
      {confirming ? "Tap Again to Show the Grimoire" : "Return to Grimoire"}
    </Button>
  );
}
