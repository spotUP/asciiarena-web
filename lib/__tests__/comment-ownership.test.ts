import { describe, expect, it } from "vitest";

import { canEditComment } from "@/lib/commentOwnership";

/**
 * Regression: the Edit button on a comment opened a form whose Save did
 * nothing -- no error, no change, the old text back after the reload.
 *
 * The list offered Edit when the comment's NICK matched the reader, while the
 * UPDATE authorised on user_id. On a row where those disagree -- a legacy
 * comment carrying a nick but no user_id -- the button appeared and the UPDATE
 * matched no row. Nothing checked the row count, so the action reported
 * success on a write that never happened.
 *
 * Both sides now ask this one function: the action to authorise, and
 * getComments to mark each row `mine` for the button.
 */
describe("canEditComment", () => {
  it("lets the author edit their own comment", () => {
    expect(canEditComment(42, 42, false)).toBe(true);
  });

  it("compares a BigInt column against a session id string", () => {
    // $queryRaw hands back INT UNSIGNED as BigInt and the session id is a
    // string: 42n === "42" is false, which is how ownership checks written
    // with a bare === deny every time.
    expect(canEditComment(42n, "42", false)).toBe(true);
  });

  it("refuses a comment belonging to somebody else", () => {
    expect(canEditComment(42, 43, false)).toBe(false);
  });

  it("refuses a legacy comment that carries no user_id", () => {
    // This is the row that produced the silent failure: the nick matched, so
    // the button showed, but there was no id for the UPDATE to match.
    expect(canEditComment(null, 42, false)).toBe(false);
    expect(canEditComment(0, 42, false)).toBe(false);
  });

  it("refuses a logged-out reader", () => {
    expect(canEditComment(42, null, false)).toBe(false);
    expect(canEditComment(42, "", false)).toBe(false);
  });

  it("lets an admin edit any comment, including an ownerless one", () => {
    expect(canEditComment(43, 42, true)).toBe(true);
    expect(canEditComment(null, 42, true)).toBe(true);
  });
});
