import {
  BookOpenText,
  Crown,
  Megaphone,
  Pointer,
  ThumbsDown,
  ThumbsUp,
  UserRoundCheck,
  UserRoundSearch,
  UsersRound,
  Vote,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type InformationTokenIconType =
  | "you-are"
  | "this-player-is"
  | "selected-you"
  | "demon"
  | "minions"
  | "bluffs"
  | "did-vote"
  | "did-nominate"
  | "good"
  | "evil";

const gestureIcons = {
  "you-are": Pointer,
  "this-player-is": UserRoundSearch,
  "selected-you": UserRoundCheck,
  "did-vote": Vote,
  "did-nominate": Megaphone,
  demon: Crown,
  minions: UsersRound,
  bluffs: BookOpenText,
  good: ThumbsUp,
  evil: ThumbsDown,
};

export function InformationTokenIcon({
  type,
  className,
}: {
  type: InformationTokenIconType;
  className?: string;
}) {
  const Icon = gestureIcons[type];

  return (
    <Icon
      aria-hidden="true"
      className={cn(
        "information-token-icon",
        type === "you-are" && "is-you-are",
        className,
      )}
    />
  );
}
