import type { Metadata } from "next";

export const siteConfig = {
  name: "BOTC Town",
  alternateName: "BOTC.Town",
  url: "https://botc.town",
  description:
    "A shared digital grimoire for running Blood on the Clocktower online or in person. Invite players and manage the game from any device.",
  socialImage: "/opengraph-image",
  socialImageAlt:
    "BOTC Town, the shared online grimoire for Blood on the Clocktower",
} as const;

type PageMetadataOptions = {
  title: string;
  path: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  index?: boolean;
};

export function createPageMetadata({
  title,
  path,
  description = siteConfig.description,
  image = siteConfig.socialImage,
  imageAlt = siteConfig.socialImageAlt,
  index = true,
}: PageMetadataOptions): Metadata {
  const fullTitle = `${title} | ${siteConfig.name}`;

  return {
    title: { absolute: fullTitle },
    description,
    alternates: index ? { canonical: path } : undefined,
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      url: index ? path : undefined,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [{ url: image, alt: imageAlt }],
    },
  };
}

export const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: siteConfig.name,
      alternateName: siteConfig.alternateName,
      description: siteConfig.description,
      inLanguage: "en-US",
    },
    {
      "@type": "WebApplication",
      "@id": `${siteConfig.url}/#application`,
      url: siteConfig.url,
      name: siteConfig.name,
      description: siteConfig.description,
      applicationCategory: "GameApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript and a modern web browser",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: 0,
        priceCurrency: "USD",
      },
      creator: {
        "@type": "Person",
        name: "Brennen Ho",
        url: "https://brennen.dev",
      },
      sameAs: ["https://github.com/brennenho/botc"],
      isPartOf: { "@id": `${siteConfig.url}/#website` },
      inLanguage: "en-US",
    },
  ],
} as const;

export function createBreadcrumbStructuredData(
  items: ReadonlyArray<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, siteConfig.url).toString(),
    })),
  };
}
