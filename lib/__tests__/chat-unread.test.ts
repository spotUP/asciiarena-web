import { describe, it, expect } from "vitest";
import { shouldCountAsUnread } from "@/lib/chatUnread";

const ME = 7;

describe("shouldCountAsUnread", () => {
  it("does not count a message the viewer wrote themselves", () => {
    expect(shouldCountAsUnread({ fromId: ME, viewerId: ME, minimized: true })).toBe(false);
  });

  it("counts a message from somebody else on a minimized window", () => {
    expect(shouldCountAsUnread({ fromId: 42, viewerId: ME, minimized: true })).toBe(true);
  });

  it("counts an event with no author rather than dropping it", () => {
    expect(shouldCountAsUnread({ fromId: null, viewerId: ME, minimized: true })).toBe(true);
    expect(shouldCountAsUnread({ fromId: undefined, viewerId: ME, minimized: true })).toBe(true);
  });

  it("never counts anything while the window is open -- it marks read instead", () => {
    expect(shouldCountAsUnread({ fromId: 42, viewerId: ME, minimized: false })).toBe(false);
    expect(shouldCountAsUnread({ fromId: ME, viewerId: ME, minimized: false })).toBe(false);
  });
});
