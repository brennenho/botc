import Image from "next/image";
import { Compass } from "lucide-react";
import type { ReactNode } from "react";

import { CharacterToken } from "@/components/grimoire/character-token";
import {
  getCharacterSheetDefinition,
  getTravellerSheetDefinition,
  type EditionId,
  type ResidentTeam,
  type Role,
} from "@/lib/game-data";
import { cn } from "@/lib/utils";

const teamPresentation: Record<
  ResidentTeam,
  { pluralLabel: string; sectionClass: string; labelClass: string }
> = {
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

const travellerPresentation = {
  sectionClass: "border-amber-800/45 bg-amber-950/[0.04]",
  labelClass: "text-amber-900",
};

export type CharacterSheetId = EditionId | "travellers";

export function CharacterSheet({
  sheetId,
  variant = "embedded",
  headerActions,
  className,
}: {
  sheetId: CharacterSheetId;
  variant?: "embedded" | "standalone";
  headerActions?: ReactNode;
  className?: string;
}) {
  const editionDefinition =
    sheetId === "travellers" ? null : getCharacterSheetDefinition(sheetId);
  const travellerDefinition =
    sheetId === "travellers" ? getTravellerSheetDefinition() : null;
  const [townsfolk, ...otherGroups] = editionDefinition?.groups ?? [];

  return (
    <article
      className={cn(
        "character-sheet text-[var(--ink)]",
        variant === "embedded" && "h-full overflow-y-auto",
        className,
      )}
    >
      <header
        className={cn(
          "flex items-center border-b border-black/10",
          variant === "standalone"
            ? "flex-wrap justify-between gap-x-5 gap-y-2 px-4 py-4 sm:gap-x-6 sm:gap-y-4 sm:px-7 sm:py-5"
            : "flex-wrap justify-between gap-3 px-5 py-4",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 items-center",
            variant === "standalone" ? "gap-4 sm:gap-5" : "gap-4",
          )}
        >
          {editionDefinition ? (
            <Image
              src={editionDefinition.edition.logoPath}
              alt=""
              width={120}
              height={90}
              priority={variant === "standalone"}
              className={cn(
                "shrink-0 object-contain",
                variant === "standalone"
                  ? "h-20 w-24 sm:h-24 sm:w-28"
                  : "h-auto w-20",
              )}
            />
          ) : (
            <div
              aria-hidden="true"
              className={cn(
                "grid shrink-0 place-items-center rounded-full border-4 border-double border-amber-800/45 bg-amber-950/[0.055] text-amber-900",
                variant === "standalone"
                  ? "h-20 w-20 sm:h-24 sm:w-24"
                  : "h-16 w-16",
              )}
            >
              <Compass
                className={cn(
                  variant === "standalone" ? "size-10 sm:size-12" : "size-8",
                )}
                strokeWidth={1.35}
              />
            </div>
          )}
          <div className="min-w-0 border-l border-black/12 pl-4">
            <p className="font-mono text-[10px] font-medium tracking-normal text-black/48 uppercase">
              {travellerDefinition ? "Character Reference" : "Character Sheet"}
            </p>
            <h1
              className={cn(
                "font-display font-semibold text-balance",
                variant === "standalone"
                  ? "mt-1 text-[26px] leading-[1.05] sm:text-4xl sm:leading-tight"
                  : "mt-0.5 text-2xl",
              )}
            >
              {travellerDefinition
                ? "Travellers"
                : editionDefinition?.edition.name}
            </h1>
            {travellerDefinition && (
              <p className="mt-1 font-mono text-[9px] text-black/42">
                {travellerDefinition.roleCount} characters · all supported
                scripts
              </p>
            )}
          </div>
        </div>
        {headerActions && (
          <div
            className={cn(
              "flex w-full min-w-0 items-center gap-3",
              variant === "standalone" && "sm:w-auto sm:justify-end",
            )}
          >
            {headerActions}
          </div>
        )}
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
            <TravellerGroup key={group.edition.id} group={group} />
          ))
        ) : (
          <>
            {townsfolk && <CharacterGroup group={townsfolk} />}
            <div className="grid min-w-0 gap-5">
              {otherGroups.map((group) => (
                <CharacterGroup key={group.team} group={group} />
              ))}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function TravellerGroup({
  group,
}: {
  group: ReturnType<typeof getTravellerSheetDefinition>["groups"][number];
}) {
  const headingId = `traveller-sheet-${group.edition.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn("min-w-0 border-t-2", travellerPresentation.sectionClass)}
    >
      <header className="flex items-baseline justify-between gap-3 px-3 pt-3 pb-2">
        <div>
          <h2
            id={headingId}
            className={cn(
              "font-mono text-[11px] font-medium tracking-normal uppercase",
              travellerPresentation.labelClass,
            )}
          >
            {group.edition.name}
          </h2>
          <p className="mt-0.5 font-mono text-[9px] text-black/38">
            Travellers
          </p>
        </div>
        <span className="font-mono text-[10px] text-black/38">
          {group.roles.length}
        </span>
      </header>
      <ul className="divide-y divide-black/[0.075] px-3">
        {group.roles.map((role) => (
          <CharacterEntry key={role.id} role={role} />
        ))}
      </ul>
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
    <section
      aria-labelledby={`character-sheet-${group.team}`}
      className={cn("min-w-0 border-t-2", presentation.sectionClass)}
    >
      <header className="flex items-baseline justify-between gap-3 px-3 pt-3 pb-2">
        <h2
          id={`character-sheet-${group.team}`}
          className={cn(
            "font-mono text-[11px] font-medium tracking-normal uppercase",
            presentation.labelClass,
          )}
        >
          {presentation.pluralLabel}
        </h2>
        <span className="font-mono text-[10px] text-black/38">
          {group.roles.length}
        </span>
      </header>
      <ul className="divide-y divide-black/[0.075] px-3">
        {group.roles.map((role) => (
          <CharacterEntry key={role.id} role={role} />
        ))}
      </ul>
    </section>
  );
}

function CharacterEntry({ role }: { role: Role }) {
  return (
    <li className="grid min-w-0 grid-cols-[46px_minmax(0,1fr)] items-center gap-3 py-2.5 first:pt-2">
      <CharacterToken
        role={role}
        size="lg"
        appearance="bare"
        imageSizes="48px"
      />
      <div className="min-w-0">
        <h3 className="text-[13px] leading-tight font-bold text-black/82">
          {role.name}
        </h3>
        <p className="mt-0.5 text-[12px] leading-[1.42] text-black/62">
          {role.ability}
        </p>
      </div>
    </li>
  );
}
