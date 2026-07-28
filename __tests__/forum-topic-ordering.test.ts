import { describe, it, expect } from "vitest";
import { compareTopics, isPostVisible } from "@/lib/forum/rules";
import { admin, member, post, topic } from "./forum-fixtures";

function order(list: ReturnType<typeof topic>[]) {
  return [...list].sort(compareTopics).map(t => t.id);
}

describe("the order topics appear in a board", () => {
  it("keeps a pinned topic on top even when an older topic gets a new reply", () => {
    const pinned = topic({ id: 1, pinned: true, lastPostAt: 100 });
    const busy = topic({ id: 2, lastPostAt: 9_000 });
    expect(order([busy, pinned])).toEqual([1, 2]);
  });

  it("moves a topic above the others as soon as it gets a reply", () => {
    const a = topic({ id: 1, lastPostAt: 100 });
    const b = topic({ id: 2, lastPostAt: 200 });
    const bumped = topic({ id: 1, lastPostAt: 300 });
    expect(order([a, b])).toEqual([2, 1]);
    expect(order([bumped, b])).toEqual([1, 2]);
  });

  it("does not shuffle two topics bumped in the same second between page loads", () => {
    const a = topic({ id: 7, lastPostAt: 500 });
    const b = topic({ id: 8, lastPostAt: 500 });
    expect(order([a, b])).toEqual([8, 7]);
    expect(order([b, a])).toEqual([8, 7]);
  });

  it("drops a topic back into date order when it is unpinned", () => {
    const wasPinned = topic({ id: 1, pinned: false, lastPostAt: 100 });
    const busy = topic({ id: 2, lastPostAt: 9_000 });
    expect(order([wasPinned, busy])).toEqual([2, 1]);
  });

  it("sorts several pinned topics among themselves by newest reply", () => {
    const p1 = topic({ id: 1, pinned: true, lastPostAt: 100 });
    const p2 = topic({ id: 2, pinned: true, lastPostAt: 900 });
    const normal = topic({ id: 3, lastPostAt: 9_999 });
    expect(order([normal, p1, p2])).toEqual([2, 1, 3]);
  });
});

describe("what a reader receives for a removed post", () => {
  it("never includes a deleted post in what an ordinary member sees", () => {
    expect(isPostVisible(post({ deletedAt: 500 }), member)).toBe(false);
  });

  it("shows an administrator the tombstone so moderation can be undone", () => {
    expect(isPostVisible(post({ deletedAt: 500 }), admin)).toBe(true);
  });

  it("shows a live post to everyone who can read the board", () => {
    expect(isPostVisible(post(), member)).toBe(true);
  });
});
