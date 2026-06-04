import { describe, it, expect } from "vitest";
import { isLeftMember, rejoinTransition, isMessageVisible, type Member } from "@/lib/chatThread";

// These guard the user-reported bug: "I left a chat and it got deleted — I can
// no longer see it, read its history, or rejoin." Leaving is a SOFT state on the
// participant row (left_at set), not a delete; rejoin must restore the row
// WITHOUT losing the original history window.

function member(over: Partial<Member> = {}): Member {
  return { userId: 7, joinedAt: 1000, leftAt: null, lastReadAt: 0, title: null, ...over };
}

describe("isLeftMember — list filtering of left-vs-active", () => {
  it("treats a row with left_at set as left (belongs in the 'left chats' view)", () => {
    expect(isLeftMember(member({ leftAt: 5000 }))).toBe(true);
  });

  it("treats a row with no left_at as active (belongs in the inbox)", () => {
    expect(isLeftMember(member({ leftAt: null }))).toBe(false);
  });
});

describe("rejoinTransition — reactivating a left participant", () => {
  it("clears left_at so the member is active again", () => {
    const after = rejoinTransition(member({ joinedAt: 1000, leftAt: 5000 }));
    expect(after.leftAt).toBeNull();
    expect(isLeftMember(after)).toBe(false);
  });

  it("PRESERVES the original joined_at so rejoin restores past history, not just future messages", () => {
    const before = member({ joinedAt: 1000, leftAt: 5000 });
    const after = rejoinTransition(before);
    expect(after.joinedAt).toBe(1000);
  });

  it("is idempotent for an already-active member", () => {
    const active = member({ leftAt: null });
    expect(rejoinTransition(active)).toEqual(active);
  });

  it("lets a rejoined member see messages posted both before they left and after they rejoin", () => {
    const left = member({ joinedAt: 1000, leftAt: 5000 });
    // While left, a message posted after left_at is NOT visible.
    expect(isMessageVisible(left, 6000)).toBe(false);
    // A historical message from the original window WAS and still is visible.
    expect(isMessageVisible(left, 3000)).toBe(true);

    const rejoined = rejoinTransition(left);
    // After rejoin: both the old history and the new message are visible.
    expect(isMessageVisible(rejoined, 3000)).toBe(true);
    expect(isMessageVisible(rejoined, 6000)).toBe(true);
  });
});
