import AxeBuilder from "@axe-core/playwright";

import { createGameViaApi, expect, test } from "./fixtures/multiplayer";

test("@smoke core entry and invitation surfaces have no automated accessibility violations", async ({
  createActor,
}) => {
  const actor = await createActor();
  await actor.page.goto("/");

  const homeResults = await new AxeBuilder({ page: actor.page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(homeResults.violations).toEqual([]);

  const created = await createGameViaApi(actor);
  const joinCode = created.snapshot.game.joinCode;
  await actor.page.goto(`/game/${joinCode}/storyteller`);
  await actor.page
    .getByRole("button", { name: `Invite players to game ${joinCode}` })
    .click();
  await expect(
    actor.page.getByRole("dialog", { name: "Invite Players" }),
  ).toBeVisible();

  const invitationResults = await new AxeBuilder({ page: actor.page })
    // Base UI's inert focus guards are browser-specific dialog plumbing, not
    // interactive controls exposed by the application.
    .exclude("[data-base-ui-focus-guard]")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(invitationResults.violations).toEqual([]);
});
