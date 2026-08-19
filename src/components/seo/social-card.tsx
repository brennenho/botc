import { readFileSync } from "node:fs";
import { join } from "node:path";

/* eslint-disable @next/next/no-img-element -- ImageResponse requires plain image elements. */

const colors = {
  ink: "#2c211a",
  mutedInk: "#6f5d4f",
  red: "#94413e",
} as const;

function readProjectFile(...segments: string[]) {
  return readFileSync(join(process.cwd(), ...segments));
}

function readPublicImage(relativePath: string, mimeType: "jpeg" | "png") {
  return `data:image/${mimeType};base64,${readProjectFile("public", relativePath).toString("base64")}`;
}

const parchmentImage = readPublicImage(
  "assets/seo/grimoire-parchment.jpg",
  "jpeg",
);
const impImage = readPublicImage("assets/seo/imp.png", "png");

export const socialCardFonts = [
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
];

export function SocialCard({ variant }: { variant: "home" | "invitation" }) {
  const isInvitation = variant === "invitation";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        boxSizing: "border-box",
        overflow: "hidden",
        color: colors.ink,
        backgroundColor: "#eadfc7",
      }}
    >
      <img
        src={parchmentImage}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0,
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "linear-gradient(118deg, rgba(255, 252, 242, 0.13), rgba(210, 184, 143, 0.07))",
        }}
      />

      <div
        style={{
          width: 620,
          height: 420,
          position: "absolute",
          top: 102,
          left: 100,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            whiteSpace: "pre-line",
            fontFamily: "Fraunces",
            fontSize: isInvitation ? 88 : 92,
            fontStyle: "italic",
            fontWeight: 400,
            letterSpacing: "-0.032em",
            lineHeight: 0.98,
          }}
        >
          {isInvitation ? "You've been\ninvited" : "Blood on the\nClocktower"}
        </div>

        {isInvitation ? (
          <div
            style={{
              width: 500,
              display: "flex",
              flexShrink: 0,
              marginTop: 26,
              color: colors.mutedInk,
              fontFamily: "Commissioner",
              fontSize: 28,
              fontWeight: 400,
              lineHeight: 1.3,
              whiteSpace: "pre-line",
            }}
          >
            {"Join a game of Blood on the\nClocktower."}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            flexShrink: 0,
            alignItems: "center",
            gap: 20,
            marginTop: "auto",
          }}
        >
          <div
            style={{
              width: 66,
              height: 2,
              display: "flex",
              backgroundColor: "rgba(44, 33, 26, 0.26)",
            }}
          />
          <div
            style={{
              display: "flex",
              color: colors.red,
              fontFamily: "IBM Plex Mono",
              fontSize: 30,
              fontWeight: 500,
              letterSpacing: "0.11em",
              lineHeight: 1,
            }}
          >
            BOTC.TOWN
          </div>
        </div>
      </div>

      <img
        src={impImage}
        alt=""
        style={{
          width: 564,
          height: 564,
          position: "absolute",
          top: "50%",
          right: isInvitation ? -6 : -30,
          objectFit: "contain",
          transform: `translateY(-50%) rotate(${isInvitation ? 2 : -2}deg)`,
        }}
      />
    </div>
  );
}
