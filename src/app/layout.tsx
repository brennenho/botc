import "@/styles/globals.css";
import "@fontsource-variable/commissioner";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/full-italic.css";
import "@fontsource/ibm-plex-mono/500.css";

import { type Metadata, type Viewport } from "next";

import { TooltipProvider } from "@/components/ui/tooltip";
import { siteConfig, siteStructuredData } from "@/lib/site-config";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `Online Grimoire | ${siteConfig.name}`,
    template: `%s | ${siteConfig.name}`,
  },
  applicationName: siteConfig.name,
  description: siteConfig.description,
  category: "games",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
    title: `Online Grimoire | ${siteConfig.name}`,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.socialImage,
        width: 1200,
        height: 630,
        alt: siteConfig.socialImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Online Grimoire | ${siteConfig.name}`,
    description: siteConfig.description,
    images: [{ url: siteConfig.socialImage, alt: siteConfig.socialImageAlt }],
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteStructuredData).replace(/</g, "\\u003c"),
          }}
        />
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
