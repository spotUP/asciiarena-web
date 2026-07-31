import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sameUserId, toUserId } from "../userId";

/**
 * Reported: the Chat button appeared on your own profile, and clicking it
 * opened a window whose Enter key did nothing.
 *
 * The page has always tried to hide it -- `session?.user?.id ? Number(...) ===
 * member.id : false` -- but `member.id` comes from prisma.$queryRaw, which
 * returns MySQL's INT UNSIGNED as a BigInt. `2 === 2n` is false, so
 * `isOwnProfile` was false on your own profile, every time. The same line also
 * gates the Unfave buttons on your own favourites, which therefore never
 * rendered.
 *
 * Confirmed on production before the fix: /member/claude-test, viewed while
 * logged in as claude-test, served a "Chat" button.
 */

describe("sameUserId", () => {
  it("matches a BigInt column against a session id string", () => {
    // The exact shape of the bug.
    expect(sameUserId(BigInt(2395), "2395")).toBe(true);
    expect(sameUserId("2395", BigInt(2395))).toBe(true);
  });

  it("matches across number, string and BigInt", () => {
    expect(sameUserId(2, 2)).toBe(true);
    expect(sameUserId(BigInt(2), 2)).toBe(true);
    expect(sameUserId("2", 2)).toBe(true);
  });

  it("does not match two different users", () => {
    expect(sameUserId(BigInt(2), 2395)).toBe(false);
    expect(sameUserId("22", 51)).toBe(false);
  });

  it("never matches when an id is missing or unusable", () => {
    // A logged-out viewer must not read as "the owner" of anything.
    expect(sameUserId(null, 2)).toBe(false);
    expect(sameUserId(undefined, 2)).toBe(false);
    expect(sameUserId(2, null)).toBe(false);
    expect(sameUserId("abc", 2)).toBe(false);
    expect(sameUserId(null, null)).toBe(false);
  });

  it("normalises to a number or null", () => {
    expect(toUserId(BigInt(7))).toBe(7);
    expect(toUserId("7")).toBe(7);
    expect(toUserId("nope")).toBe(null);
    expect(toUserId(undefined)).toBe(null);
  });

  it("treats a blank id as absent, not as user 0", () => {
    // Number("") is 0, so without this an empty session id would have matched a
    // row whose id is 0 -- and legacy messages rows do carry from_id 0.
    expect(toUserId("")).toBe(null);
    expect(toUserId("   ")).toBe(null);
    expect(toUserId(0)).toBe(null);
    expect(sameUserId("", 0)).toBe(false);
    expect(sameUserId(0, 0)).toBe(false);
  });
});

describe("ownership checks use the shared comparison", () => {
  const read = (...parts: string[]) =>
    readFileSync(path.join(__dirname, "..", "..", ...parts), "utf8");

  it("the member profile decides isOwnProfile with sameUserId", () => {
    const source = read("app", "member", "[nick]", "page.tsx");
    expect(source).toMatch(/const isOwnProfile = sameUserId\(/);
    // The comparison that never fired.
    expect(source).not.toMatch(/Number\(session\.user\.id\) === member\.id/);
  });

  it("font group member removal compares owner_id with sameUserId", () => {
    const source = read("app", "api", "font-groups", "[id]", "members", "[userId]", "route.ts");
    expect(source).toMatch(/sameUserId\(rows\[0\]\.owner_id, currentUserId\)/);
  });
});

describe("chat window", () => {
  it("reports a refused send instead of swallowing it", () => {
    // Pressing Enter in a chat the server refuses did nothing at all: only 409
    // was handled, every other status fell through to `res.json()` and was
    // dropped.
    const source = readFileSync(
      path.join(__dirname, "..", "..", "components", "chat", "ChatWindow.tsx"),
      "utf8",
    );
    expect(source).toMatch(/if \(!res\.ok\) \{[\s\S]*pushSystemLine\(/);
  });
});
