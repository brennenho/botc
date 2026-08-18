import { expect, test } from "@playwright/test";

test("public pages expose BOTC Town search and social metadata", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Online Grimoire | BOTC Town");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /^https:\/\/botc\.town\/?$/,
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /shared digital grimoire/i,
  );
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
    "content",
    "BOTC Town",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /^https:\/\/botc\.town\/opengraph-image/,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );

  const structuredData = await page
    .locator('script[type="application/ld+json"]')
    .first()
    .textContent();
  expect(structuredData).toContain('"name":"BOTC Town"');
  expect(structuredData).toContain('"@type":"WebApplication"');
});

test("private invitations stay out of search and use generic previews", async ({
  page,
}) => {
  await page.goto("/join/ABC234");

  await expect(page).toHaveTitle("Join Game | BOTC Town");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex, nofollow/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Join Game | BOTC Town",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /^https:\/\/botc\.town\/join\/opengraph-image/,
  );

  const head = await page.locator("head").innerHTML();
  expect(head).not.toContain("ABC234");
});

test("instructions replace the legacy guide without losing its URL", async ({
  page,
  request,
}) => {
  const legacyResponse = await request.get("/how-it-works", {
    maxRedirects: 0,
  });

  expect(legacyResponse.status()).toBe(308);
  expect(legacyResponse.headers().location).toBe("/instructions");

  await page.goto("/instructions");
  await expect(page).toHaveTitle("Instructions | BOTC Town");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://botc.town/instructions",
  );
  await expect(page.locator("main.entry-document-cover h1")).toHaveText(
    "Instructions",
  );

  await page.goto("/privacy");
  await expect(page.locator("main.entry-document-cover h1")).toHaveText(
    "Privacy policy",
  );
});

test("robots and sitemap expose only public routes", async ({ request }) => {
  const robotsResponse = await request.get("/robots.txt");
  const robotsText = await robotsResponse.text();
  expect(robotsResponse.ok()).toBe(true);
  expect(robotsText).toContain("Sitemap: https://botc.town/sitemap.xml");
  expect(robotsText).toContain("Disallow: /api/");

  const sitemapResponse = await request.get("/sitemap.xml");
  const sitemapText = await sitemapResponse.text();
  expect(sitemapResponse.ok()).toBe(true);
  expect(sitemapText).toContain("https://botc.town/characters");
  expect(sitemapText).toContain("https://botc.town/instructions");
  expect(sitemapText).not.toContain("https://botc.town/how-it-works");
  expect(sitemapText).not.toContain("/game/");
  expect(sitemapText).not.toContain("/join/");
});
