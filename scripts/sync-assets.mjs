import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = "https://release.botc.app/resources";
const roleEditions = new Set(["tb", "bmr", "snv"]);
const logoEditions = [...roleEditions, "taf"];

async function download(path, destination) {
  const response = await fetch(`${baseUrl}/${path}`);

  if (!response.ok) {
    throw new Error(`Failed to download ${path}: ${response.status}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const fullPath = join(root, destination);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, bytes);
}

await download("data/roles.json", "public/assets/data/roles.json");
await download("data/nightsheet.json", "public/assets/data/nightsheet.json");
await download("data/jinxes.json", "public/assets/data/jinxes.json");
await download("community/ccc-parchment.png", "public/assets/community/ccc-parchment.png");
await download("community/ccc-sleeve.png", "public/assets/community/ccc-sleeve.png");

for (const edition of logoEditions) {
  await download(`editions/${edition}/logo.webp`, `public/assets/editions/${edition}.webp`);
}

const rolesResponse = await fetch(`${baseUrl}/data/roles.json`);
if (!rolesResponse.ok) {
  throw new Error(`Failed to read role data: ${rolesResponse.status}`);
}

const roles = await rolesResponse.json();

for (const role of roles.filter((role) => roleEditions.has(role.edition))) {
  const suffix =
    role.team === "townsfolk" || role.team === "outsider"
      ? "_g"
      : role.team === "minion" || role.team === "demon"
        ? "_e"
        : "";

  await download(
    `characters/${role.edition}/${role.id}${suffix}.webp`,
    `public/assets/roles/${role.id}.webp`,
  );
}

await download("data/roles.json", "src/lib/game-data/roles.json");
await download("data/nightsheet.json", "src/lib/game-data/nightsheet.json");

console.log("BOTC resources synced.");
