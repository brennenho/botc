import Image from "next/image";
import type { ReactNode } from "react";

import { CharacterToken } from "@/components/grimoire/character-token";
import {
  getCharacterSheetDefinition,
  getTravellerSheetDefinition,
  type EditionId,
  type Team,
  type CustomScript,
  roleById,
  type Role,
} from "@/lib/game-data";
import jinxes from "../../../public/assets/data/jinxes.json";
import { cn } from "@/lib/utils";

const teamPresentation: Record<
  Team,
  { pluralLabel: string; sectionClass: string; labelClass: string }
> = {
  traveller: {
    pluralLabel: "Travellers",
    sectionClass: "border-amber-800/45 bg-amber-950/[0.04]",
    labelClass: "text-amber-900",
  },
  fabled: {
    pluralLabel: "Fabled",
    sectionClass: "border-yellow-800/40 bg-yellow-950/[0.04]",
    labelClass: "text-yellow-900",
  },
  loric: {
    pluralLabel: "Loric",
    sectionClass: "border-green-800/40 bg-green-950/[0.04]",
    labelClass: "text-green-900",
  },
  townsfolk: {
    pluralLabel: "Townsfolk",
    sectionClass: "border-sky-700/55 bg-sky-950/[0.045]",
    labelClass: "text-sky-800",
  },
  outsider: {
    pluralLabel: "Outsiders",
    sectionClass: "border-violet-700/50 bg-violet-950/[0.045]",
    labelClass: "text-violet-800",
  },
  minion: {
    pluralLabel: "Minions",
    sectionClass: "border-rose-800/55 bg-rose-950/[0.045]",
    labelClass: "text-rose-900",
  },
  demon: {
    pluralLabel: "Demons",
    sectionClass: "border-red-800/65 bg-red-950/[0.06]",
    labelClass: "text-red-900",
  },
};

const rulePresentation = {
  sectionClass: "border-stone-600/45 bg-stone-950/[0.04]",
  labelClass: "text-stone-700",
};

export type CharacterSheetId = EditionId | "travellers";

const sheetIntroductions: Record<CharacterSheetId, string> = {
  tb: "The complete Trouble Brewing character list, with every Townsfolk, Outsider, Minion, Demon, and ability.",
  bmr: "The complete Bad Moon Rising character list, with every Townsfolk, Outsider, Minion, Demon, and ability.",
  snv: "The complete Sects & Violets character list, with every Townsfolk, Outsider, Minion, Demon, and ability.",
  travellers:
    "Traveller characters and abilities for Trouble Brewing, Bad Moon Rising, and Sects & Violets.",
};

export function CharacterSheet({
  sheetId,
  variant = "embedded",
  topNavigation,
  className,
}: {
  sheetId: CharacterSheetId | CustomScript;
  variant?: "embedded" | "standalone";
  topNavigation?: ReactNode;
  className?: string;
}) {
  const editionDefinition =
    sheetId === "travellers" ? null : getCharacterSheetDefinition(sheetId);
  const travellerDefinition =
    sheetId === "travellers" ? getTravellerSheetDefinition() : null;
  const [firstGroup, ...otherGroups] = editionDefinition?.groups ?? [];

  const custom = typeof sheetId === "object" ? sheetId : null;
  return (
    <article
      className={cn(
        "character-sheet text-[var(--ink)]",
        variant === "embedded" && "h-full overflow-y-auto",
        className,
      )}
    >
      {topNavigation}
      <header
        className={cn(
          "flex items-center border-b border-black/10",
          variant === "standalone"
            ? "px-4 py-4 sm:px-7 sm:py-5"
            : "min-h-28 px-5 py-4",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 items-center",
            variant === "standalone" ? "gap-4 sm:gap-5" : "gap-4",
          )}
        >
          <Image
            src={
              editionDefinition?.edition.logoPath ?? "/assets/editions/taf.webp"
            }
            alt=""
            width={120}
            height={90}
            priority={variant === "standalone"}
            className={cn(
              "shrink-0 object-contain",
              variant === "standalone"
                ? "h-20 w-24 sm:h-24 sm:w-28"
                : "h-20 w-20",
            )}
          />
          <div className="min-w-0 border-l border-black/12 pl-4">
            <p className="font-mono text-[10px] font-medium tracking-normal text-black/48 uppercase">
              Character Sheet
            </p>
            <h1
              className={cn(
                "font-display font-semibold text-balance",
                variant === "standalone"
                  ? "mt-1 text-[26px] leading-[1.05] sm:text-4xl sm:leading-tight"
                  : "mt-0.5 text-2xl leading-tight",
              )}
            >
              {travellerDefinition
                ? "Travellers"
                : editionDefinition?.edition.name}
            </h1>
            {custom?.author && (
              <p className="mt-1 text-sm text-black/65">by {custom.author}</p>
            )}
            {variant === "standalone" && typeof sheetId === "string" ? (
              <p className="mt-2 max-w-2xl text-[12px] leading-[1.5] text-black/52 sm:text-[13px]">
                {sheetIntroductions[sheetId]}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <div
        className={cn("grid items-start gap-5 p-4 sm:p-5", {
          "lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-6 lg:p-7":
            variant === "standalone" && editionDefinition,
          "lg:grid-cols-3 lg:gap-6 lg:p-7":
            variant === "standalone" && travellerDefinition,
        })}
      >
        {travellerDefinition ? (
          travellerDefinition.groups.map((group) => (
            <SheetSection
              key={group.edition.id}
              headingId={`traveller-sheet-${group.edition.id}`}
              label={group.edition.name}
              count={group.roles.length}
              presentation={teamPresentation.traveller}
            >
              {group.roles.map((role) => (
                <CharacterEntry key={role.id} role={role} />
              ))}
            </SheetSection>
          ))
        ) : (
          <>
            {firstGroup && <CharacterGroup group={firstGroup} />}
            <div className="grid min-w-0 gap-5 empty:hidden">
              {otherGroups.map((group) => (
                <CharacterGroup key={group.team} group={group} />
              ))}
              {custom && <ScriptRules script={custom} />}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function ScriptRules({ script }: { script: CustomScript }) {
  const bootleggerRules = script.bootlegger ?? [];
  const pairs = jinxes
    .filter((role) => script.roleIds.includes(role.id))
    .flatMap((role) =>
      role.jinx
        .filter((other) => script.roleIds.includes(other.id))
        .map((other) => ({
          first: roleById.get(role.id)!,
          second: roleById.get(other.id)!,
          reason: other.reason,
        })),
    );
  return (
    <>
      {pairs.length > 0 && (
        <SheetSection
          headingId="character-sheet-jinxes"
          label="Jinxes"
          count={pairs.length}
          presentation={rulePresentation}
        >
          {pairs.map(({ first, second, reason }) => (
            <SheetEntry
              key={`${first.id}-${second.id}`}
              title={`${first.name} & ${second.name}`}
              description={reason}
              artwork={
                <span
                  className="grid size-12 grid-cols-1 grid-rows-1"
                  aria-hidden="true"
                >
                  <CharacterToken
                    role={first}
                    appearance="bare"
                    imageSizes="31px"
                    className="col-start-1 row-start-1 place-self-start"
                  />
                  <CharacterToken
                    role={second}
                    appearance="bare"
                    imageSizes="31px"
                    className="col-start-1 row-start-1 place-self-end"
                  />
                </span>
              }
            />
          ))}
        </SheetSection>
      )}
      {bootleggerRules.length > 0 && (
        <SheetSection
          headingId="character-sheet-bootlegger"
          label="Bootlegger rules"
          count={bootleggerRules.length}
          presentation={rulePresentation}
        >
          {bootleggerRules.map((rule, i) => (
            <li
              key={i}
              className="py-2.5 text-[12px] leading-[1.42] wrap-anywhere text-black/62 first:pt-2"
            >
              {rule}
            </li>
          ))}
        </SheetSection>
      )}
    </>
  );
}

function SheetSection({
  headingId,
  label,
  count,
  presentation,
  children,
}: {
  headingId: string;
  label: string;
  count: number;
  presentation: { sectionClass: string; labelClass: string };
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={headingId}
      className={cn("min-w-0 border-t-2", presentation.sectionClass)}
    >
      <header className="flex items-baseline justify-between gap-3 px-3 pt-3 pb-2">
        <h2
          id={headingId}
          className={cn(
            "font-mono text-[11px] font-medium tracking-normal uppercase",
            presentation.labelClass,
          )}
        >
          {label}
        </h2>
        <span className="font-mono text-[10px] text-black/38">{count}</span>
      </header>
      <ul className="divide-y divide-black/[0.075] px-3">{children}</ul>
    </section>
  );
}

function CharacterGroup({
  group,
}: {
  group: ReturnType<typeof getCharacterSheetDefinition>["groups"][number];
}) {
  const presentation = teamPresentation[group.team];

  return (
    <SheetSection
      headingId={`character-sheet-${group.team}`}
      label={presentation.pluralLabel}
      count={group.roles.length}
      presentation={presentation}
    >
      {group.roles.map((role) => (
        <CharacterEntry key={role.id} role={role} />
      ))}
    </SheetSection>
  );
}

function CharacterEntry({ role }: { role: Role }) {
  return (
    <SheetEntry
      title={role.name}
      description={role.ability}
      artwork={
        <CharacterToken
          role={role}
          size="lg"
          appearance="bare"
          imageSizes="48px"
        />
      }
    />
  );
}

function SheetEntry({
  title,
  description,
  artwork,
}: {
  title: string;
  description: string;
  artwork: ReactNode;
}) {
  return (
    <li className="grid min-w-0 grid-cols-[48px_minmax(0,1fr)] items-center gap-3 py-2.5 first:pt-2">
      {artwork}
      <div className="min-w-0">
        <h3 className="text-[13px] leading-tight font-bold text-black/82">
          {title}
        </h3>
        <p className="mt-0.5 text-[12px] leading-[1.42] text-black/62">
          {description}
        </p>
      </div>
    </li>
  );
}
