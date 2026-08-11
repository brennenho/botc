import "@/styles/globals.css";
import "@fontsource-variable/commissioner";
import "@fontsource-variable/fraunces";
import "@fontsource/ibm-plex-mono/500.css";

import { type Metadata, type Viewport } from "next";

import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Blood on the Clocktower",
  applicationName: "Blood on the Clocktower",
  description:
    "Online grimoire and multiplayer host for Blood on the Clocktower.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#171917",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
