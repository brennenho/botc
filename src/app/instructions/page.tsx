import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  DocumentFooter,
  DocumentPage,
  DocumentSection,
} from "@/components/entry/document-page";
import {
  createBreadcrumbStructuredData,
  createPageMetadata,
} from "@/lib/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Instructions",
  path: "/instructions",
  description:
    "How to start, join, and run a Blood on the Clocktower game with the shared grimoire.",
});

const breadcrumbs = createBreadcrumbStructuredData([
  { name: "Home", path: "/" },
  { name: "Instructions", path: "/instructions" },
]);

export default function InstructionsPage() {
  return (
    <DocumentPage
      title="Instructions"
      headerDetail={<p>For Storytellers and players</p>}
      structuredData={breadcrumbs}
      footer={
        <DocumentFooter title="Ready to play?">
          <p>Return home to create a game or join your Storyteller.</p>
          <Link href="/">
            Create or join a game
            <ArrowRight aria-hidden="true" />
          </Link>
        </DocumentFooter>
      }
    >
      <DocumentSection title="Start a game">
        <p>
          Choose an edition, enter the player count, and create the game. The
          grimoire opens with a six-character code, invite link, and QR code to
          share.
        </p>
      </DocumentSection>

      <DocumentSection title="Join a game">
        <p>
          Open the invite, enter your name, and take a seat. No account is
          required. Your character and alignment stay private until the
          Storyteller reveals them.
        </p>
      </DocumentSection>

      <DocumentSection title="Run the game">
        <p>
          Use the grimoire to assign characters, change life and alignment,
          place reminder tokens, choose Demon bluffs, add Travellers, and follow
          night order. Players see public changes on their own screens.
        </p>
      </DocumentSection>

      <DocumentSection title="Play in person or online">
        <p>
          In person, players can use their phones while the Storyteller uses a
          laptop or tablet. Online, pair the grimoire with the voice or video
          call your group already uses.
        </p>
      </DocumentSection>

      <DocumentSection title="Keep the Storyteller in charge">
        <p>
          The grimoire does not automate rules, narration, voice, or video. It
          keeps the Storyteller and player views in sync.
        </p>
      </DocumentSection>
    </DocumentPage>
  );
}
