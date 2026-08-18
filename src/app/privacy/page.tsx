import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { createPageMetadata } from "@/lib/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy",
  path: "/privacy",
  description: "How BOTC Town handles game information and site usage data.",
});

export default function PrivacyPage() {
  return (
    <main className="entry-cover privacy-cover">
      <div className="entry-leather" aria-hidden="true" />

      <article className="privacy-panel">
        <div className="privacy-inner">
          <Link href="/" className="privacy-back">
            <ArrowLeft aria-hidden="true" />
            Back to home
          </Link>

          <header className="privacy-header">
            <h1>Privacy policy</h1>
            <time dateTime="2026-08-16">Last updated August 16, 2026</time>
          </header>

          <div className="privacy-content">
            <section>
              <h2>Information we collect</h2>
              <p>
                <strong>Game information.</strong> We collect information that
                is entered or generated when a game is created, joined, or
                played. You do not need to create an account or provide an email
                address.
              </p>
              <p>
                <strong>Usage and technical information.</strong> We collect
                limited information about how the site is used, its performance,
                and errors. This may include browser and device information, an
                approximate location, and a browser identifier.
              </p>
            </section>

            <section>
              <h2>How information is used</h2>
              <p>
                We use information to provide and synchronize games and remember
                access and preferences. We also use it to understand site use,
                improve performance and reliability, diagnose errors, and
                prevent misuse.
              </p>
            </section>

            <section>
              <h2>How information is shared</h2>
              <p>
                Service providers process information on our behalf to host the
                site, store games, and provide analytics and error reporting. We
                do not sell personal information or share it for advertising.
              </p>
            </section>

            <section>
              <h2>Data retention</h2>
              <p>
                Game data is automatically deleted after seven days of
                inactivity. Usage measurements and error reports may be retained
                longer to identify trends and recurring problems.
              </p>
            </section>

            <section>
              <h2>Your choices</h2>
              <p>
                Supported Do Not Track settings are respected. You can also
                clear this site&apos;s stored data through your browser. Doing
                so may remove saved game access and preferences from that
                device.
              </p>
            </section>
          </div>

          <footer className="privacy-footer">
            <h2>Questions</h2>
            <p>
              Questions about this policy can be raised through the
              project&apos;s GitHub repository.
            </p>
            <a
              href="https://github.com/brennenho/botc"
              target="_blank"
              rel="noreferrer"
            >
              View the project on GitHub
              <ExternalLink aria-hidden="true" />
            </a>
          </footer>
        </div>
      </article>
    </main>
  );
}
