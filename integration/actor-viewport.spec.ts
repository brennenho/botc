import { expect, test } from "./fixtures/multiplayer";

test("@smoke @ipad actors use the project viewport unless overridden", async ({
  createActor,
  viewport,
}) => {
  const actor = await createActor();
  expect(actor.page.viewportSize()).toEqual(viewport);

  const override = { width: 360, height: 670 };
  const secondActor = await createActor({ viewport: override });
  expect(secondActor.page.viewportSize()).toEqual(override);
  expect(actor.page.viewportSize()).toEqual(viewport);
});
