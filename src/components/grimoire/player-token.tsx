"use client";

import { EyeOff, Vote } from "lucide-react";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  ReactNode,
  Ref,
} from "react";

import { CharacterToken } from "@/components/grimoire/character-token";
import { EmptyCharacterState } from "@/components/grimoire/empty-character-state";
import {
  PlayerPresenceDot,
  type PlayerPresenceStatus,
} from "@/components/grimoire/player-presence-dot";
import type { PlayerTokenViewModel } from "@/components/grimoire/player-token-model";
import type { ReminderLabelSide } from "@/lib/reminder-layout";
import { cn } from "@/lib/utils";

type PlayerTokenViewProps = {
  model: PlayerTokenViewModel;
  selected: boolean;
  tokenSize: number;
  labelSide: ReminderLabelSide;
  redacted: boolean;
  variant: "storyteller" | "public";
  isOwnSeat?: boolean;
  presenceStatus?: PlayerPresenceStatus;
  readOnly?: boolean;
  isDragging?: boolean;
  transform?: string;
  containerRef?: Ref<HTMLDivElement>;
  buttonProps?: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "className" | "disabled" | "style" | "type"
  >;
  onSelect?: () => void;
  nameControl: ReactNode;
};

type PlayerTokenContainerStyle = CSSProperties & {
  "--player-token-size": string;
};

export function PlayerTokenView({
  model,
  selected,
  tokenSize,
  labelSide,
  redacted,
  variant,
  isOwnSeat = false,
  presenceStatus,
  readOnly = false,
  isDragging = false,
  transform,
  containerRef,
  buttonProps,
  onSelect,
  nameControl,
}: PlayerTokenViewProps) {
  const publicView = variant === "public";
  const visibleRole = !redacted ? model.role : null;
  const interactionsDisabled = redacted || readOnly;
  const containerStyle: PlayerTokenContainerStyle = {
    "--player-token-size": `${tokenSize}px`,
    width: tokenSize,
    height: tokenSize,
    transform,
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "player-token-cluster",
        visibleRole && `team-${visibleRole.team}`,
        `player-name-${labelSide}`,
        readOnly && "is-read-only",
        isDragging && "is-dragging",
      )}
      style={containerStyle}
    >
      <button
        type="button"
        className={cn(
          "player-token tactile-action tactile-surface",
          !redacted && model.alignment && `alignment-${model.alignment}`,
          !redacted && model.isTraveller && "is-traveller",
          publicView && "is-public",
          publicView && isOwnSeat && "is-own-seat",
          publicView && !model.claimedByPlayer && "is-open-seat",
          readOnly && "is-read-only",
          selected && "is-selected",
          !model.alive && "is-dead",
          redacted && "is-redacted",
        )}
        style={{ width: tokenSize, height: tokenSize }}
        onClick={(event) => {
          event.stopPropagation();
          if (!interactionsDisabled) onSelect?.();
        }}
        disabled={interactionsDisabled}
        aria-label={getTokenAriaLabel({
          model,
          publicView,
          redacted,
          presenceStatus,
        })}
        {...buttonProps}
      >
        <PlayerTokenFace
          model={model}
          visibleRole={visibleRole}
          publicView={publicView}
          redacted={redacted}
        />
        {!model.alive && <span className="death-overlay" aria-label="Dead" />}
        {!model.alive && (
          <span
            className={cn(
              "ghost-vote-badge",
              !model.ghostVoteAvailable && "is-used",
            )}
            role="status"
            aria-label={
              model.ghostVoteAvailable
                ? "Ghost Vote Available"
                : "Ghost Vote Used"
            }
            title={
              model.ghostVoteAvailable
                ? "Ghost Vote Available"
                : "Ghost Vote Used"
            }
          >
            <Vote aria-hidden="true" />
            <span className="ghost-vote-slash" aria-hidden="true" />
          </span>
        )}
      </button>
      <div className="player-name-label">
        {nameControl}
        {visibleRole && <small>{visibleRole.name}</small>}
      </div>
    </div>
  );
}

export function StaticPlayerTokenName({
  name,
  presenceStatus,
}: {
  name: string;
  presenceStatus?: PlayerPresenceStatus;
}) {
  return (
    <span className="player-name-line">
      <span className="player-name-static">{name}</span>
      {presenceStatus && <PlayerPresenceDot status={presenceStatus} />}
    </span>
  );
}

function PlayerTokenFace({
  model,
  visibleRole,
  publicView,
  redacted,
}: {
  model: PlayerTokenViewModel;
  visibleRole: PlayerTokenViewModel["role"];
  publicView: boolean;
  redacted: boolean;
}) {
  if (redacted && (!publicView || model.claimedByPlayer)) {
    return (
      <span className="redacted-role-token" aria-hidden="true">
        <EyeOff />
        <span>Hidden</span>
      </span>
    );
  }

  if (visibleRole) {
    return <CharacterToken role={visibleRole} size="fill" appearance="bare" />;
  }

  if (!publicView) return <EmptyCharacterState variant="assignable" />;
  if (model.claimedByPlayer) {
    return <EmptyCharacterState variant="unassigned" />;
  }

  return (
    <span className="public-open-seat" aria-hidden="true">
      <strong>{model.seatIndex + 1}</strong>
      <span>Open</span>
    </span>
  );
}

function getTokenAriaLabel({
  model,
  publicView,
  redacted,
  presenceStatus,
}: {
  model: PlayerTokenViewModel;
  publicView: boolean;
  redacted: boolean;
  presenceStatus?: PlayerPresenceStatus;
}) {
  if (publicView) {
    if (!model.claimedByPlayer) return `Seat ${model.seatIndex + 1}, Open`;
    if (!presenceStatus) return model.playerName;
    return `${model.playerName}, ${presenceStatus === "online" ? "Online" : "Disconnected"}`;
  }

  if (redacted) return `${model.playerName}, Character Hidden`;

  return `${model.playerName}, ${model.role?.name ?? "Character not assigned"}. Open player controls`;
}
