import { describe, it, expect } from "vitest";
import {
  isMessageVisible,
  countUnread,
  defaultThreadTitle,
  resolveDisplayTitle,
  type Member,
  type ThreadMessage,
} from "@/lib/chatThread";

const member = (over: Partial<Member> = {}): Member => ({
  userId: 1, joinedAt: 100, leftAt: null, lastReadAt: 100, title: null, ...over,
});

describe("isMessageVisible", () => {
  it("hides messages before the member joined", () => {
    expect(isMessageVisible(member({ joinedAt: 100 }), 99)).toBe(false);
    expect(isMessageVisible(member({ joinedAt: 100 }), 100)).toBe(true);
    expect(isMessageVisible(member({ joinedAt: 100 }), 150)).toBe(true);
  });
  it("hides messages after the member left", () => {
    expect(isMessageVisible(member({ joinedAt: 100, leftAt: 200 }), 250)).toBe(false);
    expect(isMessageVisible(member({ joinedAt: 100, leftAt: 200 }), 200)).toBe(true);
  });
});

describe("countUnread", () => {
  const msgs: ThreadMessage[] = [
    { timestamp: 90, fromId: 2 },
    { timestamp: 120, fromId: 2 },
    { timestamp: 130, fromId: 1 },
    { timestamp: 140, fromId: 2 },
  ];
  it("counts visible peer messages newer than last_read_at, excluding own", () => {
    expect(countUnread(member({ joinedAt: 100, lastReadAt: 110 }), msgs, 1)).toBe(2);
  });
  it("returns 0 when everything is read", () => {
    expect(countUnread(member({ joinedAt: 100, lastReadAt: 999 }), msgs, 1)).toBe(0);
  });
});

describe("resolveDisplayTitle", () => {
  it("prefers the per-user override, then the subject, then derived nicks", () => {
    expect(resolveDisplayTitle("My name", "Subj", ["a", "b"])).toBe("My name");
    expect(resolveDisplayTitle(null, "Subj", ["a", "b"])).toBe("Subj");
    expect(resolveDisplayTitle(null, null, ["a", "b"])).toBe(defaultThreadTitle(["a", "b"]));
    expect(resolveDisplayTitle("", "Subj", ["a"])).toBe("Subj");
  });
});

describe("defaultThreadTitle", () => {
  it("joins the other participants' nicks", () => {
    expect(defaultThreadTitle(["spot"])).toBe("spot");
    expect(defaultThreadTitle(["spot", "ziphoid"])).toBe("spot, ziphoid");
    expect(defaultThreadTitle([])).toBe("(empty)");
  });
});
