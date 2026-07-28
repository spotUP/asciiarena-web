import { describe, it, expect } from "vitest";
import { recomputeBoardCounters, recomputeTopicCounters } from "@/lib/forum/counters";
import { post, topic } from "./forum-fixtures";

const TOPIC_CREATED = 1_000;

describe("a topic's reply count and last-post pointer", () => {
  it("counts the opening post, so a topic with no replies is one post and not zero", () => {
    const c = recomputeTopicCounters([post({ id: 1, createdAt: TOPIC_CREATED })], TOPIC_CREATED);
    expect(c.postCount).toBe(1);
    expect(c.firstPostId).toBe(1);
    expect(c.lastPostId).toBe(1);
  });

  it("does not leave the count one too high after a reply is deleted", () => {
    const posts = [
      post({ id: 1, createdAt: 1_000 }),
      post({ id: 2, createdAt: 2_000, deletedAt: 3_000 }),
      post({ id: 3, createdAt: 2_500 }),
    ];
    expect(recomputeTopicCounters(posts, TOPIC_CREATED).postCount).toBe(2);
  });

  it("moves last post back to the previous live reply, not to the deleted one", () => {
    const posts = [
      post({ id: 1, createdAt: 1_000, userId: 10 }),
      post({ id: 2, createdAt: 2_000, userId: 20 }),
      post({ id: 3, createdAt: 3_000, userId: 30, deletedAt: 4_000 }),
    ];
    const c = recomputeTopicCounters(posts, TOPIC_CREATED);
    expect(c.lastPostId).toBe(2);
    expect(c.lastPostAt).toBe(2_000);
    expect(c.lastUserId).toBe(20);
  });

  it("keeps a topic sortable even when every one of its posts was removed", () => {
    const posts = [post({ id: 1, createdAt: 1_500, deletedAt: 2_000 })];
    const c = recomputeTopicCounters(posts, TOPIC_CREATED);
    expect(c.postCount).toBe(0);
    expect(c.lastPostId).toBeNull();
    expect(c.lastPostAt).toBe(TOPIC_CREATED);
  });

  it("reads the newest post by id, not by the order rows came back in", () => {
    const posts = [
      post({ id: 3, createdAt: 3_000 }),
      post({ id: 1, createdAt: 1_000 }),
      post({ id: 2, createdAt: 2_000 }),
    ];
    const c = recomputeTopicCounters(posts, TOPIC_CREATED);
    expect(c.firstPostId).toBe(1);
    expect(c.lastPostId).toBe(3);
  });
});

describe("a board's topic and post totals", () => {
  it("adds up the posts across its live topics", () => {
    const c = recomputeBoardCounters([
      topic({ id: 1, postCount: 4, lastPostAt: 100 }),
      topic({ id: 2, postCount: 7, lastPostAt: 200 }),
    ]);
    expect(c.topicCount).toBe(2);
    expect(c.postCount).toBe(11);
  });

  it("stops counting a topic that was deleted", () => {
    const c = recomputeBoardCounters([
      topic({ id: 1, postCount: 4, lastPostAt: 100 }),
      topic({ id: 2, postCount: 7, lastPostAt: 200, deletedAt: 300 }),
    ]);
    expect(c.topicCount).toBe(1);
    expect(c.postCount).toBe(4);
  });

  it("shows no last post at all once the board's only topic is gone", () => {
    const c = recomputeBoardCounters([topic({ id: 1, deletedAt: 300 })]);
    expect(c.topicCount).toBe(0);
    expect(c.lastTopicId).toBeNull();
    expect(c.lastPostAt).toBeNull();
  });

  it("points at the most recently active topic, not the highest numbered one", () => {
    const c = recomputeBoardCounters([
      topic({ id: 9, lastPostAt: 100 }),
      topic({ id: 2, lastPostAt: 900 }),
    ]);
    expect(c.lastTopicId).toBe(2);
    expect(c.lastPostAt).toBe(900);
  });

  it("breaks a tie on the same timestamp by newest topic", () => {
    const c = recomputeBoardCounters([
      topic({ id: 4, lastPostAt: 500 }),
      topic({ id: 5, lastPostAt: 500 }),
    ]);
    expect(c.lastTopicId).toBe(5);
  });
});
