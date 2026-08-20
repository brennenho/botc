import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  createBreadcrumbStructuredData,
  createPageMetadata,
  siteConfig,
  siteStructuredData,
} from "@/lib/site-config";

describe("site metadata", () => {
  it("uses the BOTC Townsquare identity and canonical production host", () => {
    const metadata = createPageMetadata({
      title: "Online Grimoire",
      path: "/",
    });

    expect(siteConfig.url).toBe("https://botc.town");
    expect(metadata).toMatchObject({
      title: {
        absolute: "Online Grimoire | BOTC Townsquare",
        template: "%s | BOTC Townsquare",
      },
      description: siteConfig.description,
      alternates: { canonical: "/" },
      robots: { index: true, follow: true },
      openGraph: {
        title: "Online Grimoire | BOTC Townsquare",
        siteName: "BOTC Townsquare",
        url: "/",
      },
      twitter: {
        card: "summary_large_image",
        title: "Online Grimoire | BOTC Townsquare",
      },
    });
  });

  it("keeps private pages out of search and omits a canonical", () => {
    const metadata = createPageMetadata({
      title: "Join Game",
      path: "/join",
      index: false,
    });

    expect(metadata.alternates).toBeUndefined();
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("declares website and web application structured data", () => {
    expect(siteStructuredData["@graph"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "WebSite",
          name: "BOTC Townsquare",
        }),
        expect.objectContaining({
          "@type": "WebApplication",
          name: "BOTC Townsquare",
          isAccessibleForFree: true,
        }),
      ]),
    );
  });

  it("creates absolute breadcrumb items", () => {
    const data = createBreadcrumbStructuredData([
      { name: "Home", path: "/" },
      { name: "Trouble Brewing", path: "/tb" },
    ]);

    expect(data.itemListElement[1]).toMatchObject({
      position: 2,
      item: "https://botc.town/tb",
    });
  });
});

describe("crawl discovery", () => {
  it("publishes the sitemap location and keeps API routes out of crawling", () => {
    expect(robots()).toMatchObject({
      host: "https://botc.town",
      sitemap: "https://botc.town/sitemap.xml",
      rules: { disallow: ["/api/"] },
    });
  });

  it("sitemaps only public canonical pages", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://botc.town/");
    expect(urls).toContain("https://botc.town/instructions");
    expect(urls).toContain("https://botc.town/tb");
    expect(urls.some((url) => url.includes("/game/"))).toBe(false);
    expect(urls.some((url) => url.includes("/join/"))).toBe(false);
    expect(urls.some((url) => url.includes("/api/"))).toBe(false);
  });
});
