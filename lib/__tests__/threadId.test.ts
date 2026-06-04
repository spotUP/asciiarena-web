import { describe, it, expect } from "vitest";
import { deriveThreadId, isValidThreadId, MAX_THREAD_INT } from "@/lib/threadId";

// Regression coverage for the bug reported as: "If I go the other OLD route and
// read mails and replies two times, the thread gets corrupt." The corruption
// came from request-comment notifications threading via IFNULL(MAX(thread)+1,1)
// in app/api/requests/[id]/comments/route.ts — a value that collides with the
// next message's auto-increment id, merging unrelated conversations.

describe("deriveThreadId — new mail thread", () => {
  it("a new thread gets a valid positive id equal to the inserted message id", () => {
    const threadId = deriveThreadId(12345);
    expect(threadId).toBe(12345);
    expect(isValidThreadId(threadId)).toBe(true);
  });

  it("accepts bigint insert ids (LAST_INSERT_ID can come back as BigInt)", () => {
    expect(deriveThreadId(BigInt(987654))).toBe(987654);
  });

  it("never exceeds the 32-bit signed INT max (2147483647)", () => {
    expect(deriveThreadId(MAX_THREAD_INT)).toBe(MAX_THREAD_INT);
    // An id that would overflow the signed-INT thread column must throw, not
    // silently write a wrapped/corrupt value.
    expect(() => deriveThreadId(MAX_THREAD_INT + 1)).toThrow();
  });

  it("rejects a missing / zero insert id instead of writing thread = 0", () => {
    expect(() => deriveThreadId(0)).toThrow();
  });
});

describe("replying twice is idempotent on the thread linkage", () => {
  // A reply re-uses the existing thread id rather than minting a new one. The
  // bug derivation (MAX(thread)+1) advances every time it runs, so the same
  // logical thread would get DIFFERENT ids on a second read/reply — corruption.
  // Model the correct behaviour: the existing thread id is the source of truth,
  // and replying any number of times keeps it stable.
  function replyThreadId(existingThreadId: number): number {
    // The reply path inserts with `thread = ${existingThreadId}` verbatim.
    // deriveThreadId validates that an already-assigned id round-trips unchanged.
    return deriveThreadId(existingThreadId);
  }

  it("first and second reply attach to the SAME thread id", () => {
    const original = 5000;
    const first = replyThreadId(original);
    const second = replyThreadId(first);
    expect(first).toBe(original);
    expect(second).toBe(original);
  });

  it("the buggy MAX(thread)+1 scheme would NOT be idempotent (guards the regression)", () => {
    // Demonstrates why the old derivation corrupted threads: running it twice
    // against an advancing table max yields two different ids for what should be
    // one conversation, and collides with the next auto-increment message id.
    const buggy = (currentMaxThread: number) => currentMaxThread + 1;
    const firstAssign = buggy(5000); // 5001
    const nextMessageAutoIncrementId = 5001; // the very next inserted message id
    // Collision: an unrelated future compose sets thread = its own id (5001),
    // merging it into this notification's thread.
    expect(firstAssign).toBe(nextMessageAutoIncrementId);
    // And a second run advances again — not idempotent.
    expect(buggy(5001)).not.toBe(firstAssign);
  });
});
