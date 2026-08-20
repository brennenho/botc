import {
  createGameViaApi,
  expect,
  joinGameViaApi,
  test,
} from "./fixtures/multiplayer";

test("public pages expose BOTC Townsquare search and social metadata", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Online Grimoire | BOTC Townsquare");
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
    "BOTC Townsquare",
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
  expect(structuredData).toContain('"name":"BOTC Townsquare"');
  expect(structuredData).toContain('"@type":"WebApplication"');
});

test("private invitations stay out of search and use generic previews", async ({
  page,
}) => {
  await page.goto("/join/ABC234");

  await expect(page).toHaveTitle("Join Game | BOTC Townsquare");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex, nofollow/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Join Game | BOTC Townsquare",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /^https:\/\/botc\.town\/join\/opengraph-image/,
  );

  const head = await page.locator("head").innerHTML();
  expect(head).not.toContain("ABC234");
});

test("private game views retain the BOTC Townsquare title", async ({
  createActor,
}) => {
  const actor = await createActor();
  const created = await createGameViaApi(actor);
  const joinCode = created.snapshot.game.joinCode;

  await actor.page.goto(`/game/${joinCode}/storyteller`);
  await expect(actor.page).toHaveTitle("Grimoire | BOTC Townsquare");

  const joined = await joinGameViaApi(actor, joinCode, "Title Tester");
  await actor.page.goto(`/game/${joinCode}/player/${joined.seatId}`);
  await expect(actor.page).toHaveTitle("Game | BOTC Townsquare");
});

test("social preview image routes render PNGs", async ({ request }) => {
  for (const path of [
    "/opengraph-image",
    "/join/opengraph-image",
    "/tb/opengraph-image",
    "/bmr/opengraph-image",
    "/snv/opengraph-image",
    "/travellers/opengraph-image",
  ]) {
    const response = await request.get(path);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
    expect((await response.body()).byteLength).toBeGreaterThan(10_000);
  }
});

test("character sheets use edition-specific social previews", async ({
  page,
}) => {
  for (const path of ["/tb", "/bmr", "/snv", "/travellers"]) {
    await page.goto(path);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      new RegExp(`^https://botc\\.town${path}/opengraph-image`),
    );
  }
});

test("instructions use the canonical document route", async ({
  page,
  request,
}) => {
  const legacyResponse = await request.get("/how-it-works", {
    maxRedirects: 0,
  });

  expect(legacyResponse.status()).toBe(404);

  await page.goto("/instructions");
  await expect(page).toHaveTitle("Instructions | BOTC Townsquare");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://botc.town/instructions",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /^https:\/\/botc\.town\/opengraph-image/,
  );
  await expect(page.locator("main.entry-document-cover h1")).toHaveText(
    "Instructions",
  );

  await page.goto("/privacy");
  await expect(page.locator("main.entry-document-cover h1")).toHaveText(
    "Privacy policy",
  );
});

test("public page copy treats BOTC Townsquare as metadata, not prose", async ({
  page,
}) => {
  for (const path of ["/", "/instructions", "/tb", "/privacy"]) {
    await page.goto(path);
    expect(await page.locator("body").innerText()).not.toContain(
      "BOTC Townsquare",
    );
  }
});

test("character reference opens a sheet and retires the hub", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /Character Reference/ }).first(),
  ).toHaveAttribute("href", "/tb");

  const legacyResponse = await request.get("/characters", {
    maxRedirects: 0,
  });
  expect(legacyResponse.status()).toBe(404);
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
  expect(sitemapText).toContain("https://botc.town/tb");
  expect(sitemapText).toContain("https://botc.town/instructions");
  expect(sitemapText).not.toContain("https://botc.town/characters");
  expect(sitemapText).not.toContain("https://botc.town/how-it-works");
  expect(sitemapText).not.toContain("/game/");
  expect(sitemapText).not.toContain("/join/");
});
