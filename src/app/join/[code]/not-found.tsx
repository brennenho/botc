import { PageError } from "@/components/ui/page-error";

export default function InvitationNotFound() {
  return (
    <PageError
      title="Invitation unavailable"
      message="This invitation link is not valid. Ask your storyteller for a new link or enter the game code manually."
      homeLabel="Enter a game code"
    />
  );
}
