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
  description: "How game information and site usage data are handled.",
});

export default function PrivacyPage() {
  return (
    <DocumentPage
      title="Privacy policy"
      headerDetail={
        <time dateTime="2026-11-27">Last updated November 27, 2026</time>
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
          <strong>Usage and technical information.</strong> We use PostHog to
          measure page visits, clicks, form interactions, performance, and
          errors. We may record a session replay only while you have the
          storyteller grimoire open. It shows what appeared on your screen and
          how you interacted with it. We also collect browser and device
          information and a browser identifier. We may collect your approximate
          location and how you reached the site, such as a referring site or
          campaign.
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
          Usage measurements, session replays, and error reports may be retained
          longer to identify trends and recurring problems.
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
