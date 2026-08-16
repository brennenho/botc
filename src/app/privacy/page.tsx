import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Blood on the Clocktower",
  description: "Privacy information for the community digital grimoire.",
};

export default function PrivacyPage() {
  return (
    <main className="entry-cover privacy-cover">
      <div className="entry-leather" aria-hidden="true" />
      <article className="privacy-sheet">
        <header className="privacy-header">
          <Link href="/" className="privacy-back">
            <ArrowLeft aria-hidden="true" />
            Back to the grimoire
          </Link>
          <p>Project information</p>
          <h1>Privacy policy</h1>
          <p className="privacy-summary">
            This site collects only the information needed to run shared games.
            It does not use advertising trackers or analytics.
          </p>
          <time dateTime="2026-08-15">Last updated August 15, 2026</time>
        </header>

        <div className="privacy-content">
          <section>
            <h2>Information used by the game</h2>
            <p>
              When a game is created or joined, the site stores its edition,
              game state, player names, character assignments, reminders, and
              other details entered by the storyteller or players. You do not
              need to create an account or provide an email address.
            </p>
          </section>

          <section>
            <h2>Cookies and local preferences</h2>
            <p>
              Essential cookies identify a game’s storyteller and joined
              players. They are HTTP-only, are not used for advertising, and
              expire after seven days. The browser may also remember interface
              preferences, such as pinned panels and night-order progress, on
              the device where they were set.
            </p>
          </section>

          <section>
            <h2>How information is used</h2>
            <p>
              Game information is used only to operate the shared grimoire and
              keep participants in sync. The project does not sell personal
              information or use it to build advertising profiles.
            </p>
          </section>

          <section>
            <h2>Storage and retention</h2>
            <p>
              Game data is stored with Supabase. Games that have not been
              updated for seven days are automatically deleted. Hosting and
              infrastructure providers may process basic technical request data
              as necessary to deliver and protect the service.
            </p>
          </section>

          <section>
            <h2>Basic abuse protection</h2>
            <p>
              The site temporarily uses a network-address-derived identifier in
              server memory to limit excessive game creation and join requests.
              It is not stored with game records.
            </p>
          </section>

          <section>
            <h2>Questions</h2>
            <p>
              This is an open-source community project. Questions about this
              policy can be raised through the project’s GitHub repository.
              Please do not include game credentials or private game details in
              a public issue.
            </p>
          </section>
        </div>

        <footer className="privacy-footer">
          <p>A project by Brennen Ho.</p>
          <a
            href="https://github.com/brennenho/botc"
            target="_blank"
            rel="noreferrer"
          >
            View the code on GitHub
            <ExternalLink aria-hidden="true" />
          </a>
        </footer>
      </article>
    </main>
  );
}
