// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  getSupabaseBrowser: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => supabaseMocks);

import { useGameInvalidation } from "@/hooks/use-game-invalidation";
import { useGamePresence } from "@/hooks/use-game-presence";

describe("Realtime hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("reconciles on broadcasts, focus, visibility, and the fallback interval", async () => {
    vi.useFakeTimers();
    const onInvalidate = vi.fn();
    let broadcast: (() => void) | undefined;
    const channel = {
      on: vi.fn(
        (_type: string, _filter: { event: string }, callback: () => void) => {
          broadcast = callback;
          return channel;
        },
      ),
      subscribe: vi.fn(() => channel),
    };
    const removeChannel = vi.fn().mockResolvedValue(undefined);
    supabaseMocks.getSupabaseBrowser.mockReturnValue({
      channel: vi.fn(() => channel),
      removeChannel,
    });

    const { unmount } = renderHook(() =>
      useGameInvalidation({ gameCode: "abc234", onInvalidate }),
    );

    await act(async () => broadcast?.());
    await act(async () => window.dispatchEvent(new Event("focus")));
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    await act(async () =>
      document.dispatchEvent(new Event("visibilitychange")),
    );
    await act(async () => vi.advanceTimersByTime(15_000));

    expect(onInvalidate).toHaveBeenCalledTimes(4);
    unmount();
    expect(removeChannel).toHaveBeenCalledWith(channel);
  });

  it("tracks the current player and clears presence when Realtime fails", async () => {
    let syncPresence: (() => void) | undefined;
    let subscriptionStatus: ((status: string) => void) | undefined;
    let state: Record<string, Array<{ seatId: string; onlineAt: string }>> = {};
    const channel = {
      on: vi.fn(
        (_type: string, _filter: { event: string }, callback: () => void) => {
          syncPresence = callback;
          return channel;
        },
      ),
      subscribe: vi.fn((callback: (status: string) => void) => {
        subscriptionStatus = callback;
        return channel;
      }),
      presenceState: vi.fn(() => state),
      track: vi.fn().mockResolvedValue(undefined),
      untrack: vi.fn().mockResolvedValue(undefined),
    };
    const removeChannel = vi.fn().mockResolvedValue(undefined);
    supabaseMocks.getSupabaseBrowser.mockReturnValue({
      channel: vi.fn(() => channel),
      removeChannel,
    });

    const { result, unmount } = renderHook(() =>
      useGamePresence("ABC234", "seat-a"),
    );
    act(() => subscriptionStatus?.("SUBSCRIBED"));

    await waitFor(() => expect(result.current.status).toBe("connected"));
    expect(channel.track).toHaveBeenCalledOnce();
    const trackedPresence = channel.track.mock.calls[0]?.[0] as unknown;
    expect(trackedPresence).toEqual(
      expect.objectContaining({ seatId: "seat-a" }),
    );
    expect(typeof (trackedPresence as { onlineAt?: unknown }).onlineAt).toBe(
      "string",
    );

    state = {
      first: [
        { seatId: "seat-a", onlineAt: "2026-01-01T00:00:00.000Z" },
        { seatId: "seat-b", onlineAt: "2026-01-01T00:00:00.000Z" },
      ],
    };
    act(() => syncPresence?.());
    expect([...result.current.onlineSeatIds]).toEqual(["seat-a", "seat-b"]);

    act(() => subscriptionStatus?.("CHANNEL_ERROR"));
    expect(result.current.status).toBe("unavailable");
    expect(result.current.onlineSeatIds.size).toBe(0);

    unmount();
    expect(channel.untrack).toHaveBeenCalledOnce();
    expect(removeChannel).toHaveBeenCalledWith(channel);
  });
});
