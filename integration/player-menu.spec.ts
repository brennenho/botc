import {
  createGameFromHome,
  expect,
  getStorytellerSnapshot,
  patchStorytellerViaApi,
  test,
} from "./fixtures/multiplayer";

test("@smoke player controls expose character info and in-play reminders", async ({
  createActor,
}) => {
  const storyteller = await createActor();
  const joinCode = await createGameFromHome(storyteller);
  const snapshot = await getStorytellerSnapshot(storyteller, joinCode);
  const seats = [...snapshot.seats].sort(
    (first, second) => first.seatIndex - second.seatIndex,
  );
  const selectedSeat = seats[0]!;
  const poisonerSeat = seats[1]!;
  const response = await patchStorytellerViaApi(
    storyteller,
    joinCode,
    snapshot.game.version,
    {
      seats: snapshot.seats.map((seat) =>
        seat.id === selectedSeat.id
          ? { ...seat, roleId: "washerwoman" }
          : seat.id === poisonerSeat.id
            ? { ...seat, roleId: "poisoner", alignment: "evil" }
            : seat,
      ),
    },
  );
  expect(response.status()).toBe(200);
  await storyteller.page.reload();

  await storyteller.page
    .getByRole("button", {
      name: `${selectedSeat.playerName}, Washerwoman. Open player controls`,
    })
    .click();

  const menu = storyteller.page.getByRole("dialog", {
    name: `${selectedSeat.playerName} controls`,
  });
  await expect(menu).toBeVisible();
  await expect(
    menu.getByText(
      "You start knowing that 1 of 2 players is a particular Townsfolk.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    menu.getByRole("button", {
      name: `Add Townsfolk reminder to ${selectedSeat.playerName}`,
    }),
  ).toBeVisible();
  await expect(
    menu.getByRole("button", {
      name: `Add Poisoned reminder to ${selectedSeat.playerName}`,
    }),
  ).toBeVisible();

  await menu
    .getByRole("button", {
      name: `Add Poisoned reminder to ${selectedSeat.playerName}`,
    })
    .click();
  await expect(menu).toBeVisible();
  await expect(
    storyteller.page.getByRole("button", {
      name: `Poisoned reminder on ${selectedSeat.playerName}`,
    }),
  ).toBeVisible();

  await menu.getByRole("button", { name: "Show Character" }).click();
  await expect(
    storyteller.page.getByRole("heading", { name: "You Are" }),
  ).toBeVisible();
  await expect(
    storyteller.page.getByRole("heading", { name: "Washerwoman" }),
  ).toBeVisible();

  await storyteller.page
    .getByRole("button", { name: "Return to Grimoire" })
    .click();
  await storyteller.page
    .getByRole("button", { name: "Tap Again to Show the Grimoire" })
    .click();
  await expect(menu).toBeVisible();

  const menuBounds = await menu.boundingBox();
  const viewport = storyteller.page.viewportSize();
  expect(menuBounds).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(menuBounds!.x).toBeGreaterThanOrEqual(0);
  expect(menuBounds!.y).toBeGreaterThanOrEqual(0);
  expect(menuBounds!.x + menuBounds!.width).toBeLessThanOrEqual(
    viewport!.width,
  );
  expect(menuBounds!.y + menuBounds!.height).toBeLessThanOrEqual(
    viewport!.height,
  );
});
