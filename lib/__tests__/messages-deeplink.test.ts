import { describe, expect, it } from "vitest";

import { deepLinkThreadChange } from "@/lib/messages-deeplink";

/**
 * The bug: clicking a bell notification for a new message did not open it.
 *
 * The messages page seeds the open thread from ?thread=N with useState, which
 * only reads its argument on the first render. Clicking a notification while
 * already on /messages is a same-route navigation -- the query changes, the
 * component does not remount -- so the open thread never moved. Measured on the
 * live site: sitting on ?thread=2212 and clicking a notification for 1518 moved
 * the URL and left 2212 expanded, indefinitely.
 */
describe("messages deep link", () => {
  it("opens the thread a notification points at", () => {
    expect(deepLinkThreadChange(2212, 1518)).toEqual({ changed: true, openThread: 1518 });
  });

  it("opens a thread when arriving from a page with none", () => {
    expect(deepLinkThreadChange(null, 1518)).toEqual({ changed: true, openThread: 1518 });
  });

  it("does nothing when the link points at the thread already open", () => {
    // Re-applying on every render would fight the reader: collapsing the thread
    // by hand has to stick.
    expect(deepLinkThreadChange(1518, 1518)).toEqual({ changed: false, openThread: null });
  });

  it("does not collapse the open thread when navigating to a bare /messages", () => {
    // The prop changed, so the synced value must move, but a URL that names no
    // thread must not close the conversation the reader is reading.
    expect(deepLinkThreadChange(1518, null)).toEqual({ changed: true, openThread: null });
  });

  it("treats undefined and null alike, since the page passes either", () => {
    expect(deepLinkThreadChange(undefined, undefined)).toEqual({ changed: false, openThread: null });
    expect(deepLinkThreadChange(undefined, 1518)).toEqual({ changed: true, openThread: 1518 });
  });
});
