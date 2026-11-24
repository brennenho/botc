import Image from "next/image";
import { Check, ChevronRight } from "lucide-react";

import oneInOneOut from "../../../public/assets/scripts/one-in-one-out.json";
import hideAndSeek from "../../../public/assets/scripts/hide-and-seek.json";
import lunarEclipse from "../../../public/assets/scripts/lunar-eclipse.json";
import noGreaterJoy from "../../../public/assets/scripts/no-greater-joy.json";
import overTheRiver from "../../../public/assets/scripts/over-the-river.json";
import laissezUnFaire from "../../../public/assets/scripts/laissez-un-faire.json";
import { parseScriptExport } from "@/lib/game-data/custom-script";
import type { CustomScript } from "@/lib/game-data/types";

// Roster order and credits come from the Script Tool exports linked at
// https://bloodontheclocktower.com/pages/custom-scripts.
const teensyvilleScripts = [
  { script: parseScriptExport(noGreaterJoy), icon: "clockmaker" },
  { script: parseScriptExport(overTheRiver), icon: "grandmother" },
  { script: parseScriptExport(laissezUnFaire), icon: "leviathan" },
];

export function isTeensyvillePreset(script?: CustomScript) {
  return teensyvilleScripts.some((preset) => preset.script === script);
}

const groups = [
  {
    name: "Full scripts",
    scripts: [
      { script: parseScriptExport(oneInOneOut), icon: "villageidiot" },
      { script: parseScriptExport(hideAndSeek), icon: "damsel" },
      { script: parseScriptExport(lunarEclipse), icon: "zombuul" },
    ],
  },
  { name: "Teensyville", detail: "5–6 players", scripts: teensyvilleScripts },
];

export function ScriptPresets({
  selected,
  onSelect,
}: {
  selected?: CustomScript | null;
  onSelect: (script: CustomScript) => void;
}) {
  return (
    <div className="entry-library-groups">
      {groups.map((group) => (
        <section key={group.name}>
          <div className="entry-library-group-heading">
            <h3>{group.name}</h3>
            {group.detail && (
              <span className="text-xs text-black/65">{group.detail}</span>
            )}
          </div>
          {group.scripts.map(({ script, icon }) => (
            <button
              type="button"
              key={script.name}
              className="entry-library-preset"
              aria-pressed={selected === script}
              onClick={() => onSelect(script)}
            >
              <Image
                src={`/assets/roles/${icon}.webp`}
                width={48}
                height={48}
                alt=""
              />
              <span className="min-w-0 flex-1">
                <strong className="block font-semibold">{script.name}</strong>
                <span className="block text-xs text-black/65">
                  {script.author} ·{" "}
                  <span className="whitespace-nowrap">
                    {script.roleIds.length} characters
                  </span>
                </span>
              </span>
              {selected === script ? (
                <Check aria-hidden="true" className="size-4 shrink-0" />
              ) : (
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-black/55"
                />
              )}
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}
