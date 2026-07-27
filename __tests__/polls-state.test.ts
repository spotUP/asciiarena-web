import { describe, it, expect } from "vitest";
import {
  isPollExpired,
  isPollPending,
  isPollLive,
  effectivePollStatus,
  livePollWhere,
  canHidePoll,
} from "@/lib/polls/state";

const NOW = 1_700_000_000;
const poll = (status: "draft" | "open" | "closed", opens_at: number | null, closes_at: number | null) =>
  ({ status, opens_at, closes_at });

describe("isPollExpired", () => {
  it("treats an open poll whose closes_at has passed as expired", () => {
    expect(isPollExpired(poll("open", null, NOW - 1), NOW)).toBe(true);
  });

  it("treats closes_at exactly now as expired", () => {
    expect(isPollExpired(poll("open", null, NOW), NOW)).toBe(true);
  });

  it("leaves an open poll with time left alone", () => {
    expect(isPollExpired(poll("open", null, NOW + 1), NOW)).toBe(false);
  });

  it("leaves an open poll with no closing time alone", () => {
    expect(isPollExpired(poll("open", null, null), NOW)).toBe(false);
  });

  it("does not call a draft expired, even with a past closes_at", () => {
    expect(isPollExpired(poll("draft", null, NOW - 1), NOW)).toBe(false);
  });

  it("does not call an already-closed poll expired", () => {
    expect(isPollExpired(poll("closed", null, NOW - 1), NOW)).toBe(false);
  });
});

describe("isPollPending", () => {
  it("treats an open poll whose opens_at is still ahead as pending", () => {
    expect(isPollPending(poll("open", NOW + 1, null), NOW)).toBe(true);
  });

  it("treats opens_at exactly now as started", () => {
    expect(isPollPending(poll("open", NOW, null), NOW)).toBe(false);
  });

  it("leaves a poll with no opening time alone", () => {
    expect(isPollPending(poll("open", null, null), NOW)).toBe(false);
  });

  it("does not call a draft or closed poll pending", () => {
    expect(isPollPending(poll("draft", NOW + 1, null), NOW)).toBe(false);
    expect(isPollPending(poll("closed", NOW + 1, null), NOW)).toBe(false);
  });
});

describe("effectivePollStatus", () => {
  it("reports an expired poll as closed", () => {
    expect(effectivePollStatus(poll("open", null, NOW - 1), NOW)).toBe("closed");
  });

  it("reports a not-yet-open poll as a draft", () => {
    expect(effectivePollStatus(poll("open", NOW + 60, null), NOW)).toBe("draft");
  });

  it("reports a poll inside its window as open", () => {
    expect(effectivePollStatus(poll("open", NOW - 60, NOW + 60), NOW)).toBe("open");
  });

  it("passes every other status through untouched", () => {
    expect(effectivePollStatus(poll("open", null, null), NOW)).toBe("open");
    expect(effectivePollStatus(poll("draft", null, null), NOW)).toBe("draft");
    expect(effectivePollStatus(poll("closed", null, null), NOW)).toBe("closed");
  });
});

describe("isPollLive", () => {
  it("rejects voting on a poll whose closing time has passed", () => {
    expect(isPollLive(poll("open", null, NOW - 1), NOW)).toBe(false);
  });

  it("rejects voting on a poll that has not opened yet", () => {
    expect(isPollLive(poll("open", NOW + 1, null), NOW)).toBe(false);
  });

  it("allows voting while the poll is inside its window", () => {
    expect(isPollLive(poll("open", NOW - 1, NOW + 1), NOW)).toBe(true);
    expect(isPollLive(poll("open", null, null), NOW)).toBe(true);
  });

  it("rejects voting on drafts and closed polls", () => {
    expect(isPollLive(poll("draft", null, null), NOW)).toBe(false);
    expect(isPollLive(poll("closed", null, null), NOW)).toBe(false);
  });
});

describe("livePollWhere", () => {
  it("matches only open polls inside their scheduling window", () => {
    expect(livePollWhere(NOW)).toEqual({
      status: "open",
      AND: [
        { OR: [{ opens_at: null }, { opens_at: { lte: NOW } }] },
        { OR: [{ closes_at: null }, { closes_at: { gt: NOW } }] },
      ],
    });
  });
});

describe("canHidePoll — the dismiss control on the home page hero", () => {
  const base = { variant: "hero", hasVoted: true, isLoggedIn: true, status: "open" as const };

  it("is offered to a logged-in voter on the hero", () => {
    expect(canHidePoll(base)).toBe(true);
  });

  it("is withheld until the user has actually voted", () => {
    // Hiding a poll you never answered would quietly cost a response.
    expect(canHidePoll({ ...base, hasVoted: false })).toBe(false);
  });

  it("is not offered anonymously", () => {
    expect(canHidePoll({ ...base, isLoggedIn: false })).toBe(false);
  });

  it("only applies to the hero, not the list, page or sidebar", () => {
    for (const variant of ["list", "page", "sidebar"]) {
      expect(canHidePoll({ ...base, variant })).toBe(false);
    }
  });

  it("is pointless once the poll is over", () => {
    expect(canHidePoll({ ...base, status: "closed" })).toBe(false);
    expect(canHidePoll({ ...base, status: "draft" })).toBe(false);
  });
});
