import { RANKS } from "@/lib/accountRules";
import { EDIT_WINDOW_SECONDS, type BoardView, type ForumViewer, type PostView, type TopicView } from "@/lib/forum/types";

/**
 * Every permission question the forum asks, as pure predicates over plain
 * objects. No Prisma, no session, no clock — callers pass `now` in.
 *
 * The point of the split is that the SQL filter and the client-side list share
 * one definition of each rule, so the two cannot drift apart. That is the same
 * reason isArchived() lives in lib/chatThread.ts rather than in the query.
 */

const ADMIN_RANK = "Admin";

/**
 * Position on the rank ladder. Anything unrecognised — null, "", a legacy
 * import with a rank nobody uses any more — sorts to the FLOOR, never the top.
 * Getting this backwards would hand admin rights to every broken row.
 */
export function rankLevel(rank: string | null | undefined): number {
  if (!rank) return 0;
  const i = (RANKS as readonly string[]).indexOf(rank);
  return i === -1 ? 0 : i;
}

/** Does this viewer's rank reach `required`? A null requirement means anyone. */
export function meetsRank(viewerRank: string | null | undefined, required: string | null): boolean {
  if (required == null) return true;
  return rankLevel(viewerRank) >= rankLevel(required);
}

export function canModerate(viewer: ForumViewer): boolean {
  return viewer.rank === ADMIN_RANK;
}

export function canReadBoard(board: BoardView, viewer: ForumViewer): boolean {
  if (canModerate(viewer)) return true;
  if (board.hidden) return false;
  return meetsRank(viewer.rank, board.minReadRank);
}

/** Opening a new topic. Requires an account, an unlocked board, and the rank. */
export function canPostInBoard(board: BoardView, viewer: ForumViewer): boolean {
  if (canModerate(viewer)) return true;
  if (viewer.userId == null) return false;
  if (!canReadBoard(board, viewer)) return false;
  if (board.locked) return false;
  return meetsRank(viewer.rank, board.minPostRank);
}

/**
 * Replying. A locked BOARD still allows replies to its existing topics — only a
 * locked TOPIC stops the conversation. Locking a board is "no new threads",
 * which is a different intent from freezing every thread in it.
 */
export function canReplyToTopic(topic: TopicView, board: BoardView, viewer: ForumViewer): boolean {
  if (topic.deletedAt != null && !canModerate(viewer)) return false;
  if (canModerate(viewer)) return true;
  if (viewer.userId == null) return false;
  if (!canReadBoard(board, viewer)) return false;
  if (topic.locked) return false;
  return meetsRank(viewer.rank, board.minPostRank);
}

/**
 * Editing a post. Admins always; the author only inside the edit window.
 *
 * A created_at in the future (clock skew, a doctored row) must read as EXPIRED,
 * not as an unlimited window — the same defensive shape as
 * secondsUntilNextLogoSave() in lib/logoSaveRateLimit.ts.
 */
export function canEditPost(post: PostView, viewer: ForumViewer, now: number): boolean {
  if (post.deletedAt != null) return false;
  if (canModerate(viewer)) return true;
  if (viewer.userId == null || viewer.userId !== post.userId) return false;
  const age = now - post.createdAt;
  if (age < 0) return false;
  return age <= EDIT_WINDOW_SECONDS;
}

/** Deleting a post: the author may retract their own, admins may remove any. */
export function canDeletePost(post: PostView, viewer: ForumViewer): boolean {
  if (post.deletedAt != null) return false;
  if (canModerate(viewer)) return true;
  return viewer.userId != null && viewer.userId === post.userId;
}

/**
 * Deleting a whole topic is admin-only. An author pulling a thread other people
 * have already replied in destroys their words too.
 */
export function canDeleteTopic(topic: TopicView, viewer: ForumViewer): boolean {
  if (topic.deletedAt != null) return false;
  return canModerate(viewer);
}

/** Soft-deleted posts render as a tombstone for admins and are absent otherwise. */
export function isPostVisible(post: PostView, viewer: ForumViewer): boolean {
  return post.deletedAt == null || canModerate(viewer);
}

/**
 * Board-listing order: pinned first, then newest reply, then newest topic.
 *
 * The id tiebreak is load-bearing, not cosmetic — two topics bumped in the same
 * second would otherwise come back in whatever order the storage engine felt
 * like, and the list would appear to shuffle between page loads.
 *
 * This MUST match the ORDER BY in lib/forum/db.ts.
 */
export function compareTopics(a: TopicView, b: TopicView): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  if (a.lastPostAt !== b.lastPostAt) return b.lastPostAt - a.lastPostAt;
  return b.id - a.id;
}
