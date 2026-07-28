import { describe, it, expect } from "vitest";
import { canPostInBoard, canReplyToTopic } from "@/lib/forum/rules";
import { admin, anon, board, inactive, member, rankless, senior, topic } from "./forum-fixtures";

describe("who can start a topic", () => {
  it("turns a logged-out visitor away from the new-topic form", () => {
    expect(canPostInBoard(board(), anon)).toBe(false);
  });

  it("does not let a not-yet-activated account post", () => {
    expect(canPostInBoard(board({ minPostRank: "Member" }), inactive)).toBe(false);
  });

  it("lets a member post in a members board", () => {
    expect(canPostInBoard(board({ minPostRank: "Member" }), member)).toBe(true);
  });

  it("lets a senior member post in a board that only requires member", () => {
    expect(canPostInBoard(board({ minPostRank: "Member" }), senior)).toBe(true);
  });

  it("does not let a member post in a board reserved for senior members", () => {
    expect(canPostInBoard(board({ minPostRank: "Senior Member" }), member)).toBe(false);
  });

  it("refuses a new topic in a closed board", () => {
    expect(canPostInBoard(board({ locked: true }), member)).toBe(false);
  });

  it("still lets an administrator post in a closed board", () => {
    expect(canPostInBoard(board({ locked: true }), admin)).toBe(true);
  });

  it("does not let anyone post in a board they cannot even see", () => {
    expect(canPostInBoard(board({ minReadRank: "Admin", minPostRank: "Member" }), member)).toBe(false);
  });

  it("does not let a legacy account with no rank post", () => {
    expect(canPostInBoard(board({ minPostRank: "Member" }), rankless)).toBe(false);
  });
});

describe("who can reply to a topic", () => {
  it("refuses a reply from the topic's own author once it is locked", () => {
    expect(canReplyToTopic(topic({ locked: true, userId: 100 }), board(), member)).toBe(false);
  });

  it("still lets an administrator reply in a locked topic", () => {
    expect(canReplyToTopic(topic({ locked: true }), board(), admin)).toBe(true);
  });

  it("keeps existing topics open for replies when only the board is closed", () => {
    expect(canReplyToTopic(topic(), board({ locked: true }), member)).toBe(true);
  });

  it("turns a logged-out visitor away from the reply box", () => {
    expect(canReplyToTopic(topic(), board(), anon)).toBe(false);
  });

  it("refuses a reply to a topic that has been removed", () => {
    expect(canReplyToTopic(topic({ deletedAt: 2_000 }), board(), member)).toBe(false);
  });
});
