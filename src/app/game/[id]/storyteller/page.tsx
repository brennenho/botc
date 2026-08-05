import { StorytellerApp } from "@/components/grimoire/storyteller-app";

export default async function StorytellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StorytellerApp gameId={id} />;
}
