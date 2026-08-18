import Link from "next/link";

import {
  CharacterSheet,
  type CharacterSheetId,
} from "@/components/character-sheet/character-sheet";
import { CharacterSheetHomeLink } from "@/components/character-sheet/character-sheet-home-link";
import { editions } from "@/lib/game-data";
import { createBreadcrumbStructuredData } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const referenceSheets: {
  id: CharacterSheetId;
  name: string;
  shortName: string;
}[] = [
  ...editions,
  {
    id: "travellers",
    name: "Travellers",
    shortName: "Trav.",
  },
];

export function CharacterSheetPage({ sheetId }: { sheetId: CharacterSheetId }) {
  const activeSheet = referenceSheets.find((sheet) => sheet.id === sheetId);
  const breadcrumbs = createBreadcrumbStructuredData([
    { name: "Home", path: "/" },
    { name: "Characters", path: "/characters" },
    { name: activeSheet?.name ?? "Character Sheet", path: `/${sheetId}` },
  ]);

  return (
    <main className="min-h-svh bg-[var(--parchment)] bg-[url('/assets/grimoire-parchment.webp')] bg-cover bg-fixed text-[var(--ink)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-7">
        <CharacterSheet
          sheetId={sheetId}
          variant="standalone"
          topNavigation={
            <nav
              className="flex min-w-0 items-stretch border-b border-black/12 bg-black/[0.025]"
              aria-label="Character Sheet Navigation"
            >
              <div className="flex min-w-0 flex-1 overflow-x-auto">
                {referenceSheets.map((sheet) => (
                  <Link
                    key={sheet.id}
                    href={`/${sheet.id}`}
                    aria-current={sheet.id === sheetId ? "page" : undefined}
                    className={cn(
                      "-mb-px flex min-h-11 min-w-0 flex-1 items-center justify-center border-b-2 border-transparent px-2.5 text-[11px] font-semibold whitespace-nowrap text-black/48 transition-colors hover:text-black/76 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:px-3",
                      sheet.id === sheetId && "border-black/55 text-black/82",
                    )}
                  >
                    <span className="sm:hidden">{sheet.shortName}</span>
                    <span className="hidden sm:inline">{sheet.name}</span>
                  </Link>
                ))}
              </div>
              <div className="ml-2 flex min-h-11 w-11 shrink-0 items-center justify-center">
                <CharacterSheetHomeLink />
              </div>
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
