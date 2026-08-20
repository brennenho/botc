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
});
