import type { BoardView, ForumViewer, PostView, TopicView } from "@/lib/forum/types";

// Shared builders for the forum rule tests. Not a .test.ts file, so vitest
// imports it without trying to run it.

export function board(over: Partial<BoardView> = {}): BoardView {
  return {
    id: 1,
    slug: "general",
    name: "General",
    description: "",
    sortOrder: 0,
    minReadRank: null,
    minPostRank: "Member",
    locked: false,
    hidden: false,
    topicCount: 0,
    postCount: 0,
    lastPostAt: null,
    lastTopicId: null,
    lastTopicTitle: null,
    lastTopicSlug: null,
    lastUserNick: null,
    ...over,
  };
}

export function topic(over: Partial<TopicView> = {}): TopicView {
  return {
    id: 10,
    boardId: 1,
    slug: "a-topic-10",
    title: "A topic",
    userId: 100,
    authorNick: "spot",
    pinned: false,
    locked: false,
    postCount: 1,
    viewCount: 0,
    lastPostAt: 1_000,
    lastUserNick: "spot",
    deletedAt: null,
    createdAt: 1_000,
    ...over,
  };
}

export function post(over: Partial<PostView> = {}): PostView {
  return {
    id: 50,
    topicId: 10,
    boardId: 1,
    userId: 100,
    authorNick: "spot",
    body: "hello",
    ansiB64: null,
    ansiFont: null,
    editedAt: null,
    editCount: 0,
    deletedAt: null,
    createdAt: 1_000,
    ...over,
  };
}

export const anon: ForumViewer = { userId: null, rank: null };
export const inactive: ForumViewer = { userId: 200, rank: "Inactive" };
export const member: ForumViewer = { userId: 100, rank: "Member" };
export const otherMember: ForumViewer = { userId: 101, rank: "Member" };
export const senior: ForumViewer = { userId: 102, rank: "Senior Member" };
export const admin: ForumViewer = { userId: 1, rank: "Admin" };
/** A legacy import: a real account row whose rank column was never set. */
export const rankless: ForumViewer = { userId: 300, rank: null };
