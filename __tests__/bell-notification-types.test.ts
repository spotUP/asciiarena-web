import { describe, it, expect } from "vitest";
import { BELL_NOTIFICATION_TYPES } from "@/lib/notification-types";
import { ACTIVITY_TYPES } from "@/lib/activity-types";

describe("BELL_NOTIFICATION_TYPES — the bell is for things addressed to you", () => {
  it("carries messages and request activity", () => {
    expect(BELL_NOTIFICATION_TYPES).toContain("notif-message");
    expect(BELL_NOTIFICATION_TYPES).toContain("notif-reply");
    expect(BELL_NOTIFICATION_TYPES).toContain("notif-status");
  });

  it("does not carry comments or favourites", () => {
    // These are ambient: for anyone who uploaded a large slice of the archive
    // they fire constantly and bury the messages that need an answer. They
    // belong in the site-wide live feed instead.
    expect(BELL_NOTIFICATION_TYPES).not.toContain("notif-comment");
    expect(BELL_NOTIFICATION_TYPES).not.toContain("notif-fav");
  });

  it("stays inside the set users can opt out of", () => {
    // ACTIVITY_TYPES doubles as the per-user opt-out key list (it covers both
    // feed activity and notif-* kinds), so a bell type missing from it would
    // be one nobody could ever mute.
    for (const kind of BELL_NOTIFICATION_TYPES) {
      expect(ACTIVITY_TYPES).toContain(kind);
    }
  });
});

describe("the live feed still covers what the bell dropped", () => {
  it("broadcasts comments and favourites site-wide", () => {
    expect(ACTIVITY_TYPES).toContain("comment");
    expect(ACTIVITY_TYPES).toContain("fav");
  });
});
