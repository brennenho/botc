import { expect, test } from "@playwright/test";

test("the homepage can use an install prompt offered on another route", async ({
  page,
}) => {
  await page.goto("/instructions");
  const prompt = await page.evaluateHandle(() => {
    const event = Object.assign(
      new Event("beforeinstallprompt", { cancelable: true }),
      {
        calls: 0,
        prompt() {
          this.calls++;
          return Promise.resolve();
        },
        userChoice: Promise.resolve({ outcome: "dismissed" }),
      },
    );
    window.dispatchEvent(event);
    return event;
  });

  await page.getByRole("link", { name: "Back to home" }).click();
  const install = page.getByRole("button", { name: "Install app" });
  await install.click();
  expect(await prompt.evaluate((event) => event.calls)).toBe(1);
  await expect(install).toHaveAttribute("aria-haspopup", "dialog");
  await install.click();
  const guide = page.getByRole("dialog", { name: "Install app" });
  await expect(guide).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(guide).toBeHidden();
  await expect(install).toBeFocused();
  expect(await prompt.evaluate((event) => event.calls)).toBe(1);

  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(install).toHaveCount(0);
});

test("@smoke iPhone offers home screen instructions and hides them in the installed app", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "webkit", "Uses the mobile WebKit profile");
  await page.goto("/");
  const appleIcon = page.locator('link[rel="apple-touch-icon"]');
  await expect(appleIcon).toHaveAttribute("href", "/apple-touch-icon.png");
  await expect(appleIcon).toHaveAttribute("sizes", "180x180");
  await expect(
    page.locator('meta[name="apple-mobile-web-app-title"]'),
  ).toHaveAttribute("content", "BOTC");
  const manifestUrl = await page
    .locator('link[rel="manifest"]')
    .evaluate((link: HTMLLinkElement) => link.href);
  const manifest = await page.request.get(manifestUrl);
  expect(await manifest.json()).toMatchObject({
    name: "BOTC",
    short_name: "BOTC",
    display: "standalone",
  });
  const install = page.getByRole("button", { name: "Install app" });
  await install.click();
  const guide = page.getByRole("dialog", { name: "Install app" });
  await expect(guide).toHaveAccessibleDescription(
    "Save this website as an app on your device.",
  );
  await expect(guide.getByRole("listitem")).toHaveCount(2);
  await expect(
    guide
      .getByRole("listitem")
      .getByText("Add to Home Screen", { exact: true }),
  ).toBeVisible();
  await guide
    .getByRole("button", { name: "Close install instructions" })
    .click();
  await expect(guide).toBeHidden();

  await page.addInitScript(() => {
    Object.defineProperty(navigator, "standalone", { value: true });
  });
  await page.reload();
  await page.getByRole("button", { name: /Storyteller/ }).click();
  await page.getByRole("button", { name: "Back to game options" }).click();
  await expect(install).toHaveCount(0);
});

test.describe("Chrome on iPhone", () => {
  test.use({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0.7444.148 Mobile/15E148 Safari/604.1",
  });

  test("@smoke explains how to install from Chrome’s Share menu", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "webkit", "Uses the iOS WebKit engine");
    await page.goto("/");
    await page.getByRole("button", { name: "Install app" }).click();
    const guide = page.getByRole("dialog", { name: "Install app" });
    await expect(guide.getByRole("listitem")).toHaveText([
      "Tap Share beside Chrome’s address bar, then choose Add to Home Screen.",
      "Turn on Open as Web App if shown, then tap Add.",
    ]);
  });
});
