import {
  CharacterSheet,
  type CharacterSheetId,
} from "@/components/character-sheet/character-sheet";
import { CharacterSheetHomeLink } from "@/components/character-sheet/character-sheet-home-link";
import { Tabs } from "@/components/ui/tabs";
import { editions } from "@/lib/game-data";
import { createBreadcrumbStructuredData } from "@/lib/site-config";

const sheetLinks = [
  ...editions,
  {
    id: "travellers",
    name: "Travellers",
    shortName: "Trav.",
  },
].map((sheet) => ({
  value: sheet.id,
  label: sheet.name,
  shortLabel: sheet.shortName,
  href: `/${sheet.id}`,
}));

export function CharacterSheetPage({ sheetId }: { sheetId: CharacterSheetId }) {
  const activeSheet = sheetLinks.find((sheet) => sheet.value === sheetId);
  const breadcrumbs = createBreadcrumbStructuredData([
    { name: "Home", path: "/" },
    { name: activeSheet?.label ?? "Character Sheet", path: `/${sheetId}` },
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
            <Tabs
              label="Character Sheet Navigation"
              value={sheetId}
              links={sheetLinks}
            >
              <div className="ml-2 flex min-h-11 w-11 shrink-0 items-center justify-center">
                <CharacterSheetHomeLink />
              </div>
            </Tabs>
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
