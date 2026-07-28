import { describe, it, expect } from "vitest";
import { canReadBoard, rankLevel, meetsRank } from "@/lib/forum/rules";
import { admin, anon, board, member, rankless } from "./forum-fixtures";

describe("who can see a forum board", () => {
  it("shows a public board to a logged-out visitor", () => {
    expect(canReadBoard(board({ minReadRank: null }), anon)).toBe(true);
  });

  it("hides a members-only board from a logged-out visitor", () => {
    expect(canReadBoard(board({ minReadRank: "Member" }), anon)).toBe(false);
  });

  it("shows a members-only board to a member", () => {
    expect(canReadBoard(board({ minReadRank: "Member" }), member)).toBe(true);
  });

  it("does not let a legacy account with no rank into a members-only board", () => {
    expect(canReadBoard(board({ minReadRank: "Member" }), rankless)).toBe(false);
  });

  it("hides a staged board from a member but not from an administrator", () => {
    const staged = board({ hidden: true });
    expect(canReadBoard(staged, member)).toBe(false);
    expect(canReadBoard(staged, admin)).toBe(true);
  });

  it("hides an administrators-only board from a member", () => {
    expect(canReadBoard(board({ minReadRank: "Admin" }), member)).toBe(false);
  });

  it("treats a rank nobody uses any more as the bottom of the ladder, not the top", () => {
    expect(rankLevel("Sysop")).toBe(0);
    expect(canReadBoard(board({ minReadRank: "Member" }), { userId: 5, rank: "Sysop" })).toBe(false);
  });

  it("lets anyone past a board with no read requirement at all", () => {
    expect(meetsRank(null, null)).toBe(true);
    expect(meetsRank("Inactive", null)).toBe(true);
  });

  it("ranks the ladder in the order the admin page has always shown", () => {
    expect(rankLevel("Inactive")).toBeLessThan(rankLevel("Member"));
    expect(rankLevel("Member")).toBeLessThan(rankLevel("Senior Member"));
    expect(rankLevel("Senior Member")).toBeLessThan(rankLevel("Admin"));
  });
});
