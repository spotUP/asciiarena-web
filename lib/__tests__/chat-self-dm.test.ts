import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isSelfDm, SELF_DM_MESSAGE } from "../chatPeer";

/**
 * Reported: spot could start a chat with himself, and the window that opened
 * was not empty -- it was the group conversation with diNO and dipswitch.
 *
 * Two defects stacked:
 *
 *   1. Nothing refused a DM whose peer is the sender. /api/chat/users and
 *      /api/chat/user happily offered the viewer their own account, and
 *      /api/chat/send only checked `peerId` was a positive integer.
 *   2. /api/chat/thread resolves a 1:1 thread with
 *      `(from_id = me AND to_id = peer) OR (from_id = peer AND to_id = me)`.
 *      With peer == me both halves collapse to `from_id = me AND to_id = me`,
 *      which matches any self-addressed row left over from an earlier
 *      self-chat -- including one whose thread has since had other people
 *      added to it. The lookup then handed back that group thread, so the
 *      "chat with myself" window was really diNO and dipswitch's, and anything
 *      typed into it would have gone to them.
 *
 * The invariant the code never modelled: a direct message is between two
 * DISTINCT users.
 */

describe("isSelfDm", () => {
  it("rejects a conversation whose peer is the sender", () => {
    expect(isSelfDm(7, 7)).toBe(true);
  });

  it("allows a conversation between two different people", () => {
    expect(isSelfDm(7, 9)).toBe(false);
  });

  it("matches a database id against a session id", () => {
    // The defect this test exists for: /api/chat/user compares a column read
    // through prisma.$queryRaw, and MySQL's INT UNSIGNED comes back as a
    // BigInt. `Number.isFinite(2395n)` is false, so the guard skipped and the
    // endpoint handed the composer its own account -- while lib/db.ts's
    // BigInt.prototype.toJSON patch serialised the id as a plain number, so the
    // response looked correct. Verified against production before the fix:
    // GET /api/chat/user?nick=claude-test returned 200 for the viewer.
    expect(isSelfDm(BigInt(2395), 2395)).toBe(true);
    expect(isSelfDm(BigInt(2395), 22)).toBe(false);
    // Session ids arrive as strings from NextAuth in some call sites.
    expect(isSelfDm(2395, "2395")).toBe(true);
  });

  it("treats an unusable peer id as not a self-DM, so the id check owns that error", () => {
    // Callers validate the id separately; conflating "missing" with "myself"
    // would report the wrong reason to the user.
    expect(isSelfDm(NaN, 7)).toBe(false);
    expect(isSelfDm(null, 7)).toBe(false);
    expect(isSelfDm(undefined, 7)).toBe(false);
  });

  it("carries one message for every refusal site", () => {
    expect(SELF_DM_MESSAGE).toMatch(/yourself/i);
  });
});

function apiSource(...parts: string[]): string {
  return readFileSync(path.join(__dirname, "..", "..", "app", "api", ...parts), "utf8");
}

describe("chat endpoints refuse the viewer's own account", () => {
  // An import of the helper is not a guard -- these match the call that
  // actually returns the error, so deleting the check fails the test.
  it("the DM thread lookup will not resolve a thread for a self peer", () => {
    // This is the one that returned the diNO/dipswitch thread.
    const source = apiSource("chat", "thread", "route.ts");
    expect(source).toMatch(/if \(isSelfDm\(.*\)\) return apiError\(SELF_DM_MESSAGE, 400\)/);
  });

  it("sending refuses a self-addressed message", () => {
    const source = apiSource("chat", "send", "route.ts");
    expect(source).toMatch(/if \(isSelfDm\(.*\)\) return apiError\(SELF_DM_MESSAGE, 400\)/);
  });

  it("nick suggestions exclude the viewer", () => {
    const source = apiSource("chat", "users", "route.ts");
    expect(source).toMatch(/id <> /);
  });

  it("nick lookup refuses the viewer", () => {
    const source = apiSource("chat", "user", "route.ts");
    expect(source).toMatch(/if \(isSelfDm\(.*\)\) return apiError\(SELF_DM_MESSAGE, 400\)/);
  });

  it("adding a member refuses your own account", () => {
    // Re-adding yourself resets joined_at, announces "you joined" to the room,
    // and sends your own client a thread-added event, which opens a second
    // window on the conversation you are already in.
    const source = apiSource("chat", "thread", "[threadId]", "members", "route.ts");
    expect(source).toMatch(/if \(isSelfDm\(newUserId, me\)\) return apiError\(/);
  });
});
