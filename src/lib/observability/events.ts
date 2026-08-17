import type { EditionId } from "@/lib/game-data";

export type ProductEvents = {
  demon_bluff_assigned: {
    actor_role: "storyteller";
    assigned: boolean;
    slot: number;
  };
  game_created: {
    actor_role: "storyteller";
    edition: EditionId;
    player_count: number;
  };
  game_invitation_opened: {
    actor_role: "storyteller" | "player";
  };
  game_invitation_shared: {
    actor_role: "storyteller" | "player";
    method: "native" | "link" | "code";
  };
  game_joined: { actor_role: "player" };
  player_added: { actor_role: "storyteller" };
  player_removed: { actor_role: "storyteller" };
  reminder_added: { actor_role: "storyteller" };
  reminder_removed: { actor_role: "storyteller" };
  role_assigned: { actor_role: "storyteller"; assigned: boolean };
  role_assignments_cleared: { actor_role: "storyteller" };
  roles_distributed: { actor_role: "storyteller"; role_count: number };
};
