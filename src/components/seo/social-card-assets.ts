import { readFileSync } from "node:fs";
import { join } from "node:path";

function readProjectFile(...segments: string[]) {
  return readFileSync(join(process.cwd(), ...segments));
}

function readPublicImage(relativePath: string, mimeType: "jpeg" | "png") {
  return `data:image/${mimeType};base64,${readProjectFile("public", relativePath).toString("base64")}`;
}

function createSocialCardAssets() {
  return {
    parchmentImage: readPublicImage(
      "assets/seo/grimoire-parchment.jpg",
      "jpeg",
    ),
    impImage: readPublicImage("assets/seo/imp.png", "png"),
    fonts: [
      {
        name: "Fraunces",
        data: readProjectFile(
          "node_modules/@fontsource/fraunces/files/fraunces-latin-400-italic.woff",
        ),
        weight: 400 as const,
        style: "italic" as const,
      },
      {
        name: "Commissioner",
        data: readProjectFile(
          "node_modules/@fontsource/commissioner/files/commissioner-latin-400-normal.woff",
        ),
        weight: 400 as const,
        style: "normal" as const,
      },
      {
        name: "IBM Plex Mono",
        data: readProjectFile(
          "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff",
        ),
        weight: 500 as const,
        style: "normal" as const,
      },
    ],
  };
}

let socialCardAssets: ReturnType<typeof createSocialCardAssets> | undefined;

export function loadSocialCardAssets() {
  socialCardAssets ??= createSocialCardAssets();
  return socialCardAssets;
}
