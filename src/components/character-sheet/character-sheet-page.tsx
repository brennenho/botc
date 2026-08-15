import Link from "next/link";

import { CharacterSheet } from "@/components/character-sheet/character-sheet";
import { CharacterSheetHomeLink } from "@/components/character-sheet/character-sheet-home-link";
import { editions, type EditionId } from "@/lib/game-data";
import { cn } from "@/lib/utils";

export function CharacterSheetPage({ editionId }: { editionId: EditionId }) {
  return (
    <main className="min-h-svh bg-[var(--parchment)] bg-[url('/assets/grimoire-parchment.png')] bg-cover bg-fixed text-[var(--ink)]">
      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-7">
        <CharacterSheet
          editionId={editionId}
          variant="standalone"
          headerActions={
            <nav
              className="flex w-full min-w-0 items-center gap-2 sm:w-auto"
              aria-label="Character Sheet Navigation"
            >
              <div className="flex min-w-0 flex-1 rounded-[var(--radius-control)] bg-black/[0.055] p-0.5 sm:flex-none">
                {editions.map((edition) => (
                  <Link
                    key={edition.id}
                    href={`/${edition.id}`}
                    aria-current={edition.id === editionId ? "page" : undefined}
                    className={cn(
                      "flex min-h-8 min-w-0 flex-1 items-center justify-center rounded-[calc(var(--radius-control)-2px)] px-3 text-xs font-semibold whitespace-nowrap text-black/52 transition-colors hover:text-black/78 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus-ring)] sm:min-w-28 sm:flex-none",
                      edition.id === editionId &&
                        "bg-[#fbf6e9] text-black/82 shadow-[0_1px_3px_rgb(54_37_17/0.14)]",
                    )}
                  >
                    <span className="sm:hidden">{edition.shortName}</span>
                    <span className="hidden sm:inline">{edition.name}</span>
                  </Link>
                ))}
              </div>
              <span aria-hidden="true" className="h-5 w-px bg-black/12" />
              <CharacterSheetHomeLink />
            </nav>
          }
          className="overflow-hidden border border-black/12 bg-[#f4ecd9]/84 shadow-[0_12px_36px_rgb(62_41_18/0.14)] backdrop-blur-[2px]"
        />
        <p className="mx-auto max-w-3xl px-3 py-5 text-center text-[10px] leading-relaxed text-black/40">
          This is an unofficial community-made project and is not affiliated
          with The Pandemonium Institute. Blood on the Clocktower is a trademark
          of Steven Medway and The Pandemonium Institute.
        </p>
      </div>
    </main>
  );
}
