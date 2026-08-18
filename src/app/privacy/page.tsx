import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";

import {
  DocumentFooter,
  DocumentPage,
  DocumentSection,
} from "@/components/entry/document-page";
import { createPageMetadata } from "@/lib/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy",
  path: "/privacy",
  description: "How BOTC Town handles game information and site usage data.",
});

export default function PrivacyPage() {
  return (
    <DocumentPage
      title="Privacy policy"
      headerDetail={
        <time dateTime="2026-08-16">Last updated August 16, 2026</time>
      }
      footer={
        <DocumentFooter title="Questions">
          <p>
            Questions about this policy can be raised through the project&apos;s
            GitHub repository.
          </p>
          <a
            href="https://github.com/brennenho/botc"
            target="_blank"
            rel="noreferrer"
          >
            View the project on GitHub
            <ExternalLink aria-hidden="true" />
          </a>
        </DocumentFooter>
      }
    >
      <DocumentSection title="Information we collect">
        <p>
          <strong>Game information.</strong> We collect information that is
          entered or generated when a game is created, joined, or played. You do
          not need to create an account or provide an email address.
        </p>
        <p>
          <strong>Usage and technical information.</strong> We collect limited
          information about how the site is used, its performance, and errors.
          This may include browser and device information, an approximate
          location, and a browser identifier.
        </p>
      </DocumentSection>

      <DocumentSection title="How information is used">
        <p>
          We use information to provide and synchronize games and remember
          access and preferences. We also use it to understand site use, improve
          performance and reliability, diagnose errors, and prevent misuse.
        </p>
      </DocumentSection>

      <DocumentSection title="How information is shared">
        <p>
          Service providers process information on our behalf to host the site,
          store games, and provide analytics and error reporting. We do not sell
          personal information or share it for advertising.
        </p>
      </DocumentSection>

      <DocumentSection title="Data retention">
        <p>
          Game data is automatically deleted after seven days of inactivity.
          Usage measurements and error reports may be retained longer to
          identify trends and recurring problems.
        </p>
      </DocumentSection>

      <DocumentSection title="Your choices">
        <p>
          Supported Do Not Track settings are respected. You can also clear this
          site&apos;s stored data through your browser. Doing so may remove
          saved game access and preferences from that device.
        </p>
      </DocumentSection>
    </DocumentPage>
  );
}
