import { describe, it, expect } from "vitest";
import { BELL_NOTIFICATION_TYPES } from "@/lib/notification-types";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ACTIVITY_TYPES, ACTIVITY_LABELS } from "@/lib/activity-types";
import { KIND_VERB } from "@/lib/notificationLabel";

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

describe("forum notifications", () => {
  it("lights the bell when someone replies to your topic", () => {
    expect(BELL_NOTIFICATION_TYPES).toContain("notif-forum-reply");
  });

  it("lights the bell when someone mentions you", () => {
    expect(BELL_NOTIFICATION_TYPES).toContain("notif-mention");
  });

  it("does not reuse the request-reply kind, which reads 'replied to your request'", () => {
    expect(KIND_VERB["notif-forum-reply"]).not.toBe(KIND_VERB["notif-reply"]);
  });

  it("gives every notification kind words to render, so the bell never shows a raw type string", () => {
    for (const kind of BELL_NOTIFICATION_TYPES) {
      expect(KIND_VERB[kind], `no KIND_VERB entry for ${kind}`).toBeTruthy();
    }
  });

  it("gives every activity type a settings label, so none is un-mutable in practice", () => {
    for (const t of ACTIVITY_TYPES) {
      expect(ACTIVITY_LABELS[t], `no ACTIVITY_LABELS entry for ${t}`).toBeTruthy();
    }
  });
});

describe("the opt-out list still fits where it is stored and sent", () => {
  it("fits users.activity_hidden_types when a user mutes absolutely everything", () => {
    // VarChar(255). Adding types is cheap until it silently is not.
    expect(ACTIVITY_TYPES.join(",").length).toBeLessThanOrEqual(255);
  });

  it("is not capped by a hardcoded number the type list can outgrow", () => {
    // A literal .max(20) in the settings route silently rejects "hide
    // everything" as soon as ACTIVITY_TYPES passes 20 entries. Assert the cap
    // is derived from the list itself, by reading the route rather than
    // re-deriving the same constant here (which would prove nothing).
    const route = readFileSync(
      resolve(process.cwd(), "app/api/settings/activity/route.ts"),
      "utf8",
    );
    const cap = /\.max\(([^)]*)\)/.exec(route);
    expect(cap, "no .max() found on the hidden-types array").not.toBeNull();
    expect(cap![1].trim()).toBe("ACTIVITY_TYPES.length");
  });
});
