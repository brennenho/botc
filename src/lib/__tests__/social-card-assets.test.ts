import { beforeEach, describe, expect, it, vi } from "vitest";

const { readFileSync } = vi.hoisted(() => ({
  readFileSync: vi.fn((path: string) => Buffer.from(path)),
}));

vi.mock("node:fs", () => ({ readFileSync }));
vi.mock("next/og", () => ({ ImageResponse: class ImageResponse {} }));

describe("social card assets", () => {
  beforeEach(() => {
    vi.resetModules();
    readFileSync.mockClear();
  });

  it("does not read files while Next imports image metadata modules", async () => {
    await import("@/app/opengraph-image");
    await import("@/app/join/opengraph-image");
    await import("@/app/tb/opengraph-image");
    await import("@/app/bmr/opengraph-image");
    await import("@/app/snv/opengraph-image");
    await import("@/app/travellers/opengraph-image");

    expect(readFileSync).not.toHaveBeenCalled();
  });

  it("loads the assets lazily and caches them", async () => {
    const { loadSocialCardAssets } =
      await import("@/components/seo/social-card-assets");

    expect(readFileSync).not.toHaveBeenCalled();

    const firstLoad = loadSocialCardAssets();
    const secondLoad = loadSocialCardAssets();

    expect(readFileSync).toHaveBeenCalledTimes(5);
    expect(secondLoad).toBe(firstLoad);
  });

  it("loads and caches only the requested edition artwork", async () => {
    const { loadCharacterSheetSocialCardAssets } =
      await import("@/components/seo/social-card-assets");

    const firstLoad = loadCharacterSheetSocialCardAssets("tb");
    const secondLoad = loadCharacterSheetSocialCardAssets("tb");

    expect(readFileSync).toHaveBeenCalledTimes(6);
    expect(secondLoad.editionImage).toBe(firstLoad.editionImage);

    loadCharacterSheetSocialCardAssets("bmr");

    expect(readFileSync).toHaveBeenCalledTimes(7);
    expect(readFileSync).toHaveBeenLastCalledWith(
      expect.stringContaining("assets/seo/editions/bmr.png"),
    );
  });
});
