import type { PostView, TopicView } from "@/lib/forum/types";

/**
 * The forum denormalizes post counts and a last-post pointer onto topics and
 * boards, because the board listing's "newest reply first" cannot be indexed at
 * all if last_post_at has to be derived by a groupwise-max over forum_posts.
 *
 * Denormalized counters drift. These pure recomputes are the repair: the same
 * definition of "correct" is used by the admin resync, by the transactional
 * write path, and by the unit tests, so there is only one answer to argue with.
 *
 * Soft-deleted rows never count. A deleted newest reply must hand "last post"
 * back to the previous LIVE one, not leave a pointer at a tombstone.
 */

export interface TopicCounters {
  postCount: number;
  firstPostId: number | null;
  lastPostId: number | null;
  lastPostAt: number | null;
  lastUserId: number | null;
}

export function recomputeTopicCounters(posts: PostView[], topicCreatedAt: number): TopicCounters {
  const live = posts.filter(p => p.deletedAt == null).sort((a, b) => a.id - b.id);
  const last = live[live.length - 1];
  return {
    postCount: live.length,
    firstPostId: live[0]?.id ?? null,
    lastPostId: last?.id ?? null,
    // A topic whose every post was deleted still needs a sortable timestamp,
    // or it would vanish from an ORDER BY last_post_at listing.
    lastPostAt: last?.createdAt ?? topicCreatedAt,
    lastUserId: last?.userId ?? null,
  };
}

export interface BoardCounters {
  topicCount: number;
  postCount: number;
  lastTopicId: number | null;
  lastPostId: number | null;
  lastPostAt: number | null;
  lastUserId: number | null;
}

export function recomputeBoardCounters(topics: TopicView[]): BoardCounters {
  const live = topics.filter(t => t.deletedAt == null);
  let newest: TopicView | null = null;
  for (const t of live) {
    if (!newest || t.lastPostAt > newest.lastPostAt || (t.lastPostAt === newest.lastPostAt && t.id > newest.id)) {
      newest = t;
    }
  }
  return {
    topicCount: live.length,
    postCount: live.reduce((sum, t) => sum + t.postCount, 0),
    lastTopicId: newest?.id ?? null,
    lastPostId: null, // filled by the caller, which has the post row
    lastPostAt: newest?.lastPostAt ?? null,
    lastUserId: null,
  };
}
