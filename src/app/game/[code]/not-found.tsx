import { PageError } from "@/components/ui/page-error";

export default function GameNotFound() {
  return (
    <PageError
      title="Game unavailable"
      message="This game may have ended, or this link is no longer valid."
    />
  );
}
