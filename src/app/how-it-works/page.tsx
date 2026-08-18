import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import {
  createBreadcrumbStructuredData,
  createPageMetadata,
} from "@/lib/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "How It Works",
  path: "/how-it-works",
  description:
    "See how Storytellers and players use BOTC Town to run Blood on the Clocktower online or together around the same table.",
});

const breadcrumbs = createBreadcrumbStructuredData([
  { name: "BOTC Town", path: "/" },
  { name: "How It Works", path: "/how-it-works" },
]);

export default function HowItWorksPage() {
  return (
    <main className="min-h-svh bg-[#180b09] p-2 text-[#2b211b] sm:p-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c"),
        }}
      />
      <article className="mx-auto min-h-[calc(100svh-1rem)] max-w-5xl overflow-hidden rounded-lg border border-[#493022] bg-[#e9ddc6] bg-[url('/assets/grimoire-parchment.webp')] bg-cover shadow-[0_22px_54px_rgb(0_0_0/0.42)] sm:min-h-[calc(100svh-2rem)] sm:rounded-xl">
        <nav
          className="flex items-center justify-between gap-4 border-b border-black/10 px-5 py-4 sm:px-9"
          aria-label="Page navigation"
        >
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#653336] underline decoration-[#653336]/30 underline-offset-4 hover:decoration-current"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            BOTC Town
          </Link>
          <Link
            href="/characters"
            className="text-xs font-semibold text-black/55 underline decoration-black/20 underline-offset-4 hover:text-black/80"
          >
            Characters
          </Link>
        </nav>

        <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9 sm:py-16">
          <header className="max-w-3xl border-b border-black/12 pb-10">
            <p className="font-mono text-[10px] font-semibold tracking-[0.12em] text-[#71373a] uppercase">
              BOTC Town guide
            </p>
            <h1 className="font-display mt-3 text-4xl leading-[0.98] font-semibold tracking-[-0.025em] text-balance sm:text-6xl">
              Run the town, together.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-black/62 sm:text-lg">
              BOTC Town is a shared digital grimoire for Blood on the
              Clocktower. It keeps the Storyteller in control while players
              follow the game from their own devices—whether everyone is remote
              or sitting around the same table.
            </p>
          </header>

          <div className="grid gap-10 py-10 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-14 sm:py-14">
            <section aria-labelledby="storyteller-heading">
              <p className="font-mono text-[10px] font-semibold text-[#8a6946] uppercase">
                Storyteller
              </p>
              <h2
                id="storyteller-heading"
                className="font-display mt-2 text-2xl font-semibold"
              >
                Open the grimoire
              </h2>
              <p className="mt-3 text-sm leading-6 text-black/62">
                Choose Trouble Brewing, Bad Moon Rising, or Sects &amp; Violets,
                set the player count, and create a private game. Share its
                invitation link, QR code, or six-character code with the group.
              </p>
            </section>

            <section aria-labelledby="player-heading">
              <p className="font-mono text-[10px] font-semibold text-[#8a6946] uppercase">
                Players
              </p>
              <h2
                id="player-heading"
                className="font-display mt-2 text-2xl font-semibold"
              >
                Join without an account
              </h2>
              <p className="mt-3 text-sm leading-6 text-black/62">
                Players open the invitation, enter their name, and take a seat.
                Their character and alignment stay private until the Storyteller
                reveals them.
              </p>
            </section>

            <section aria-labelledby="play-heading">
              <p className="font-mono text-[10px] font-semibold text-[#8a6946] uppercase">
                During play
              </p>
              <h2
                id="play-heading"
                className="font-display mt-2 text-2xl font-semibold"
              >
                Keep one shared town
              </h2>
              <p className="mt-3 text-sm leading-6 text-black/62">
                The Storyteller manages characters, life state, alignment,
                reminder tokens, Demon bluffs, Travellers, and night order.
                Player screens stay synchronized with the public town state.
              </p>
            </section>

            <section aria-labelledby="scope-heading">
              <p className="font-mono text-[10px] font-semibold text-[#8a6946] uppercase">
                Human-led
              </p>
              <h2
                id="scope-heading"
                className="font-display mt-2 text-2xl font-semibold"
              >
                The Storyteller still tells the story
              </h2>
              <p className="mt-3 text-sm leading-6 text-black/62">
                BOTC Town organizes and synchronizes the grimoire; it does not
                automate decisions, narration, voice, or video. Use the call or
                table setup that already works for your group.
              </p>
            </section>
          </div>

          <section
            className="border-t border-black/12 pt-10"
            aria-labelledby="questions-heading"
          >
            <h2
              id="questions-heading"
              className="font-display text-3xl font-semibold"
            >
              Common questions
            </h2>
            <dl className="mt-7 grid gap-7 sm:grid-cols-2 sm:gap-x-12">
              <div>
                <dt className="font-semibold">Is BOTC Town official?</dt>
                <dd className="mt-2 text-sm leading-6 text-black/60">
                  No. It is an unofficial community project and is not
                  affiliated with The Pandemonium Institute.
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Do players need accounts?</dt>
                <dd className="mt-2 text-sm leading-6 text-black/60">
                  No. Players join a private game with an invitation and their
                  name.
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Can we play in person?</dt>
                <dd className="mt-2 text-sm leading-6 text-black/60">
                  Yes. The shared player view works well on phones while the
                  Storyteller runs the grimoire from a laptop or tablet.
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Which editions are included?</dt>
                <dd className="mt-2 text-sm leading-6 text-black/60">
                  Trouble Brewing, Bad Moon Rising, Sects &amp; Violets, and
                  their associated Travellers are supported.
                </dd>
              </div>
            </dl>
          </section>

          <footer className="mt-12 flex flex-col items-start justify-between gap-5 border-t border-black/12 pt-8 sm:flex-row sm:items-center">
            <p className="max-w-xl text-xs leading-5 text-black/45">
              Blood on the Clocktower is a trademark of Steven Medway and The
              Pandemonium Institute.
            </p>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#653336] px-5 text-sm font-semibold text-[#f7edda] shadow-sm hover:bg-[#4d2528]"
            >
              Enter BOTC Town
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </footer>
        </div>
      </article>
    </main>
  );
}
