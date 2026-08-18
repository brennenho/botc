import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { editions } from "@/lib/game-data";
import {
  createBreadcrumbStructuredData,
  createPageMetadata,
} from "@/lib/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Characters",
  path: "/characters",
  description:
    "Browse Blood on the Clocktower characters and abilities for Trouble Brewing, Bad Moon Rising, Sects & Violets, and Travellers.",
});

const referenceSheets = [
  ...editions.map((edition) => ({
    href: `/${edition.id}`,
    name: edition.name,
    logoPath: edition.logoPath,
    description: `${edition.name} characters and abilities`,
  })),
  {
    href: "/travellers",
    name: "Travellers",
    logoPath: "/assets/editions/taf.webp",
    description: "Traveller characters across all supported editions",
  },
];

const breadcrumbs = createBreadcrumbStructuredData([
  { name: "BOTC Town", path: "/" },
  { name: "Characters", path: "/characters" },
]);

export default function CharactersPage() {
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
            href="/instructions"
            className="text-xs font-semibold text-black/55 underline decoration-black/20 underline-offset-4 hover:text-black/80"
          >
            Instructions
          </Link>
        </nav>

        <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9 sm:py-16">
          <header className="max-w-3xl">
            <p className="font-mono text-[10px] font-semibold tracking-[0.12em] text-[#71373a] uppercase">
              Character reference
            </p>
            <h1 className="font-display mt-3 text-4xl leading-none font-semibold tracking-[-0.025em] sm:text-6xl">
              Know the town.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-black/62">
              Browse every character and ability in the three base editions,
              plus their Travellers. These reference sheets are available
              without creating or joining a game.
            </p>
          </header>

          <div className="mt-10 grid gap-px overflow-hidden border border-black/12 bg-black/12 sm:grid-cols-2">
            {referenceSheets.map((sheet) => (
              <Link
                key={sheet.href}
                href={sheet.href}
                className="group grid min-h-40 grid-cols-[88px_minmax(0,1fr)_20px] items-center gap-5 bg-[#f1e7d2]/95 p-5 transition-colors hover:bg-[#f8f0df] focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#71373a]"
              >
                <Image
                  src={sheet.logoPath}
                  alt=""
                  width={88}
                  height={88}
                  className="h-20 w-20 object-contain"
                />
                <span className="min-w-0">
                  <strong className="font-display block text-xl font-semibold">
                    {sheet.name}
                  </strong>
                  <small className="mt-2 block text-xs leading-5 text-black/50">
                    {sheet.description}
                  </small>
                </span>
                <ArrowRight
                  className="size-4 text-[#71373a] transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>

          <footer className="mt-10 border-t border-black/12 pt-7 text-xs leading-5 text-black/42">
            This is an unofficial community project and is not affiliated with
            The Pandemonium Institute. Blood on the Clocktower is a trademark of
            Steven Medway and The Pandemonium Institute.
          </footer>
        </div>
      </article>
    </main>
  );
}
