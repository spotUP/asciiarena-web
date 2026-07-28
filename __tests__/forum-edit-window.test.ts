import { describe, it, expect } from "vitest";
import { canDeletePost, canDeleteTopic, canEditPost } from "@/lib/forum/rules";
import { EDIT_WINDOW_SECONDS } from "@/lib/forum/types";
import { admin, member, otherMember, post, topic } from "./forum-fixtures";

const POSTED_AT = 1_000;
const p = post({ userId: member.userId!, createdAt: POSTED_AT });

describe("editing your own post", () => {
  it("lets the author fix a typo right after posting", () => {
    expect(canEditPost(p, member, POSTED_AT + 30)).toBe(true);
  });

  it("stops the author editing once the edit window has closed", () => {
    expect(canEditPost(p, member, POSTED_AT + EDIT_WINDOW_SECONDS + 1)).toBe(false);
  });

  it("lets an administrator edit a post of any age", () => {
    expect(canEditPost(p, admin, POSTED_AT + 10 * 365 * 24 * 3600)).toBe(true);
  });

  it("never lets a stranger edit someone else's post", () => {
    expect(canEditPost(p, otherMember, POSTED_AT + 1)).toBe(false);
  });

  it("does not hand out an unlimited window to a post dated in the future", () => {
    const skewed = post({ userId: member.userId!, createdAt: POSTED_AT + 10_000 });
    expect(canEditPost(skewed, member, POSTED_AT)).toBe(false);
  });

  it("does not let the author edit a deleted post back into existence", () => {
    const gone = post({ userId: member.userId!, createdAt: POSTED_AT, deletedAt: POSTED_AT + 5 });
    expect(canEditPost(gone, member, POSTED_AT + 10)).toBe(false);
  });
});

describe("removing posts and topics", () => {
  it("lets the author retract their own post", () => {
    expect(canDeletePost(p, member)).toBe(true);
  });

  it("does not let one member delete another member's post", () => {
    expect(canDeletePost(p, otherMember)).toBe(false);
  });

  it("does not let a topic's author delete a thread other people replied in", () => {
    expect(canDeleteTopic(topic({ userId: member.userId! }), member)).toBe(false);
  });

  it("lets an administrator delete a topic", () => {
    expect(canDeleteTopic(topic(), admin)).toBe(true);
  });

  it("does not delete the same thing twice", () => {
    expect(canDeletePost(post({ deletedAt: 5 }), admin)).toBe(false);
    expect(canDeleteTopic(topic({ deletedAt: 5 }), admin)).toBe(false);
  });
});
