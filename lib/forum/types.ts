/**
 * Shapes and limits for the forum, free of any Prisma or next-auth import so
 * client components and unit tests can use them without a database — the same
 * split as lib/activity-types.ts vs lib/activity.ts.
 */

/** Who is looking. `userId` null means logged out; `rank` null means no rank. */
export interface ForumViewer {
  userId: number | null;
  rank: string | null;
}

export interface BoardView {
  id: number;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  minReadRank: string | null;
  minPostRank: string;
  locked: boolean;
  hidden: boolean;
  topicCount: number;
  postCount: number;
  lastPostAt: number | null;
  lastTopicId: number | null;
  lastTopicTitle: string | null;
  lastTopicSlug: string | null;
  lastUserNick: string | null;
}

export interface TopicView {
  id: number;
  boardId: number;
  slug: string;
  title: string;
  userId: number;
  authorNick: string | null;
  pinned: boolean;
  locked: boolean;
  postCount: number;
  viewCount: number;
  lastPostAt: number;
  lastUserNick: string | null;
  deletedAt: number | null;
  createdAt: number;
}

export interface PostView {
  id: number;
  topicId: number;
  boardId: number;
  userId: number;
  authorNick: string | null;
  body: string;
  /** Reserved for the ANSI-art attachment. Null on every post today. */
  ansiB64: string | null;
  ansiFont: string | null;
  editedAt: number | null;
  editCount: number;
  deletedAt: number | null;
  createdAt: number;
}

export const TOPICS_PER_PAGE = 40;
export const POSTS_PER_PAGE = 20;

export const MAX_TITLE_LEN = 160;
export const MIN_TITLE_LEN = 3;
export const MAX_BODY_LEN = 16000;

/**
 * How long the author of a post may still edit it. Fifteen minutes covers
 * "I typoed that" without letting someone rewrite history under a reply that
 * already answered them.
 */
export const EDIT_WINDOW_SECONDS = 900;

/** Ceiling on how many people one post can notify. */
export const MAX_MENTIONS_PER_POST = 5;

/**
 * Ceiling on a post's ANSI attachment, as base64 characters. 256KB of raw
 * bytes matches the site logo limit in lib/logoUpload.ts; base64 is 4/3 of
 * that. The column is MEDIUMTEXT so this is a policy limit, not a storage one
 * -- MEDIUMTEXT would happily accept 16MB per post on a box whose disk has
 * already been filled once.
 */
export const MAX_ANSI_B64_LEN = Math.ceil((256 * 1024 * 4) / 3);
