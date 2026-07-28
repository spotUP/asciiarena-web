import { afterEach, describe, expect, it, vi } from "vitest";

import { clearListening, listListening, setListening } from "@/lib/site-now-playing";

/**
 * Presence for the site music player: who is listening to what, right now.
 *
 * The expiry is the part worth pinning. Without it the map grows forever from
 * people who played one tune and left, and the widget shows listeners who
 * closed the tab hours ago as if they were still here.
 */
describe("site now playing", () => {
  afterEach(() => {
    vi.useRealTimers();
    // The store is module state; leave it empty for the next test.
    for (const l of listListening()) clearListening(l.userId);
  });

  it("reports what someone is playing", () => {
    setListening(1, "Spot", "anita - Mortimer Twang");

    expect(listListening()).toEqual([
      expect.objectContaining({ userId: 1, nick: "Spot", track: "anita - Mortimer Twang" }),
    ]);
  });

  it("replaces the previous track rather than stacking them up", () => {
    setListening(1, "Spot", "first tune");
    setListening(1, "Spot", "second tune");

    const live = listListening();
    expect(live).toHaveLength(1);
    expect(live[0].track).toBe("second tune");
  });

  it("drops a listener once the presence window passes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-28T12:00:00Z"));
    setListening(1, "Spot", "a tune");

    vi.setSystemTime(new Date("2026-07-28T12:04:00Z"));
    expect(listListening()).toHaveLength(1); // 4 minutes: still here

    vi.setSystemTime(new Date("2026-07-28T12:05:30Z"));
    expect(listListening()).toEqual([]); // past the 5 minute window
  });

  it("forgets a listener who stops", () => {
    setListening(1, "Spot", "a tune");
    clearListening(1);

    expect(listListening()).toEqual([]);
  });

  it("lists the most recent listener first", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-28T12:00:00Z"));
    setListening(1, "Spot", "older");
    vi.setSystemTime(new Date("2026-07-28T12:00:30Z"));
    setListening(2, "diNO", "newer");

    expect(listListening().map(l => l.nick)).toEqual(["diNO", "Spot"]);
  });
});
