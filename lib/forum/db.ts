import { prisma } from "@/lib/db";
import { recomputeBoardCounters, recomputeTopicCounters } from "@/lib/forum/counters";
import { canModerate, canReadBoard } from "@/lib/forum/rules";
import { topicSlug } from "@/lib/forum/slug";
import {
  POSTS_PER_PAGE,
  TOPICS_PER_PAGE,
  type BoardView,
  type ForumViewer,
  type PostView,
  type TopicView,
} from "@/lib/forum/types";

/**
 * Every database access the forum makes. The rules themselves live in
 * lib/forum/rules.ts so they stay unit-testable without a database; this file
 * applies them and does the joins.
 *
 * Author nicks are joined rather than denormalized (see the schema comment), so
 * each listing does one extra batched `users` lookup keyed by id.
 */

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

async function nickMap(ids: Array<number | null | undefined>): Promise<Map<number, string>> {
  const wanted = [...new Set(ids.filter((x): x is number => typeof x === "number"))];
  if (wanted.length === 0) return new Map();
  const rows = await prisma.users.findMany({
    where: { id: { in: wanted } },
    select: { id: true, nick: true },
  });
  return new Map(rows.map(r => [r.id, r.nick]));
}

type BoardRow = Awaited<ReturnType<typeof prisma.forum_boards.findMany>>[number];
type TopicRow = Awaited<ReturnType<typeof prisma.forum_topics.findMany>>[number];
type PostRow = Awaited<ReturnType<typeof prisma.forum_posts.findMany>>[number];

function toBoard(r: BoardRow, extra: Partial<BoardView> = {}): BoardView {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    sortOrder: r.sort_order,
    minReadRank: r.min_read_rank,
    minPostRank: r.min_post_rank,
    locked: r.locked,
    hidden: r.hidden,
    topicCount: r.topic_count,
    postCount: r.post_count,
    lastPostAt: r.last_post_at,
    lastTopicId: r.last_topic_id,
    lastTopicTitle: null,
    lastTopicSlug: null,
    lastUserNick: null,
    ...extra,
  };
}

function toTopic(r: TopicRow, authorNick: string | null, lastUserNick: string | null): TopicView {
  return {
    id: r.id,
    boardId: r.board_id,
    slug: r.slug,
    title: r.title,
    userId: r.user_id,
    authorNick,
    pinned: r.pinned,
    locked: r.locked,
    postCount: r.post_count,
    viewCount: r.view_count,
    lastPostAt: r.last_post_at,
    lastUserNick,
    deletedAt: r.deleted_at,
    createdAt: r.created_at,
  };
}

function toPost(r: PostRow, authorNick: string | null): PostView {
  return {
    id: r.id,
    topicId: r.topic_id,
    boardId: r.board_id,
    userId: r.user_id,
    body: r.body,
    authorNick,
    ansiB64: r.ansi_b64,
    ansiFont: r.ansi_font,
    editedAt: r.edited_at,
    editCount: r.edit_count,
    deletedAt: r.deleted_at,
    createdAt: r.created_at,
  };
}

// --- reads ----------------------------------------------------------------

/** Boards this viewer may see, in display order, with their last-post line. */
export async function listBoards(viewer: ForumViewer): Promise<BoardView[]> {
  const rows = await prisma.forum_boards.findMany({
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
  });
  const visible = rows.filter(r => canReadBoard(toBoard(r), viewer));

  const topicRows = await prisma.forum_topics.findMany({
    where: { id: { in: visible.map(b => b.last_topic_id).filter((x): x is number => x != null) } },
    select: { id: true, title: true, slug: true },
  });
  const topics = new Map(topicRows.map(t => [t.id, t]));
  const nicks = await nickMap(visible.map(b => b.last_user_id));

  return visible.map(r => {
    const t = r.last_topic_id != null ? topics.get(r.last_topic_id) : undefined;
    return toBoard(r, {
      lastTopicTitle: t?.title ?? null,
      lastTopicSlug: t?.slug ?? null,
      lastUserNick: r.last_user_id != null ? nicks.get(r.last_user_id) ?? null : null,
    });
  });
}

export async function getBoardBySlug(slug: string): Promise<BoardView | null> {
  const r = await prisma.forum_boards.findUnique({ where: { slug } });
  return r ? toBoard(r) : null;
}

export type TopicSortKey = "title" | "replies" | "author" | "last_post";

/**
 * One page of a board's topics. Pinned always leads, then the chosen column.
 * The default order here MUST match compareTopics() in lib/forum/rules.ts.
 */
export async function listTopics(
  boardId: number,
  opts: { page: number; sortBy: TopicSortKey; order: "asc" | "desc"; filter?: string; viewer: ForumViewer },
): Promise<{ topics: TopicView[]; total: number }> {
  const where = {
    board_id: boardId,
    ...(canModerate(opts.viewer) ? {} : { deleted_at: null }),
    ...(opts.filter ? { title: { contains: opts.filter } } : {}),
  };

  const column = {
    title: { title: opts.order },
    replies: { post_count: opts.order },
    author: { user_id: opts.order },
    last_post: { last_post_at: opts.order },
  }[opts.sortBy];

  const [rows, total] = await Promise.all([
    prisma.forum_topics.findMany({
      where,
      orderBy: [{ pinned: "desc" }, column, { id: "desc" }],
      skip: (opts.page - 1) * TOPICS_PER_PAGE,
      take: TOPICS_PER_PAGE,
    }),
    prisma.forum_topics.count({ where }),
  ]);

  const nicks = await nickMap(rows.flatMap(r => [r.user_id, r.last_user_id]));
  return {
    topics: rows.map(r =>
      toTopic(r, nicks.get(r.user_id) ?? null, r.last_user_id != null ? nicks.get(r.last_user_id) ?? null : null),
    ),
    total,
  };
}

export async function getTopic(id: number): Promise<TopicView | null> {
  const r = await prisma.forum_topics.findUnique({ where: { id } });
  if (!r) return null;
  const nicks = await nickMap([r.user_id, r.last_user_id]);
  return toTopic(r, nicks.get(r.user_id) ?? null, r.last_user_id != null ? nicks.get(r.last_user_id) ?? null : null);
}

export async function getBoardById(id: number): Promise<BoardView | null> {
  const r = await prisma.forum_boards.findUnique({ where: { id } });
  return r ? toBoard(r) : null;
}

/**
 * One page of a topic's posts, oldest first. Non-moderators never receive the
 * body of a deleted post -- it is filtered in SQL, not hidden in the markup.
 */
export async function listPosts(
  topicId: number,
  opts: { page: number; viewer: ForumViewer },
): Promise<{ posts: PostView[]; total: number; firstIndex: number; asOf: number }> {
  const where = {
    topic_id: topicId,
    ...(canModerate(opts.viewer) ? {} : { deleted_at: null }),
  };
  const [rows, total] = await Promise.all([
    prisma.forum_posts.findMany({
      where,
      orderBy: { id: "asc" },
      skip: (opts.page - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
    }),
    prisma.forum_posts.count({ where }),
  ]);
  const nicks = await nickMap(rows.map(r => r.user_id));
  return {
    posts: rows.map(r => toPost(r, nicks.get(r.user_id) ?? null)),
    total,
    firstIndex: (opts.page - 1) * POSTS_PER_PAGE + 1,
    // The moment these posts were read, for evaluating the edit window against.
    // It belongs here rather than in the page: reading the clock while
    // rendering is an impure call, and the window should be measured against
    // when the data was fetched anyway. The server action re-checks with a
    // fresh clock before accepting an edit, so this only decides whether the
    // control is offered.
    asOf: Math.floor(Date.now() / 1000),
  };
}

export async function getPost(id: number): Promise<PostView | null> {
  const r = await prisma.forum_posts.findUnique({ where: { id } });
  if (!r) return null;
  const nicks = await nickMap([r.user_id]);
  return toPost(r, nicks.get(r.user_id) ?? null);
}

/** Newest live posts across every board the viewer may read. Sidebar widget. */
export async function listRecentPosts(
  viewer: ForumViewer,
  limit: number,
): Promise<Array<PostView & { topicTitle: string; topicSlug: string; boardSlug: string }>> {
  const boards = await listBoards(viewer);
  if (boards.length === 0) return [];
  const rows = await prisma.forum_posts.findMany({
    where: { deleted_at: null, board_id: { in: boards.map(b => b.id) } },
    orderBy: { id: "desc" },
    take: limit,
  });
  if (rows.length === 0) return [];

  const topics = new Map(
    (
      await prisma.forum_topics.findMany({
        where: { id: { in: [...new Set(rows.map(r => r.topic_id))] }, deleted_at: null },
        select: { id: true, title: true, slug: true },
      })
    ).map(t => [t.id, t]),
  );
  const boardSlugs = new Map(boards.map(b => [b.id, b.slug]));
  const nicks = await nickMap(rows.map(r => r.user_id));

  return rows.flatMap(r => {
    const t = topics.get(r.topic_id);
    const bs = boardSlugs.get(r.board_id);
    if (!t || !bs) return [];
    return [{ ...toPost(r, nicks.get(r.user_id) ?? null), topicTitle: t.title, topicSlug: t.slug, boardSlug: bs }];
  });
}

/** Nicks that actually exist, from the candidates lib/forum/mentions.ts found. */
export async function resolveMentionNicks(candidates: string[]): Promise<Array<{ id: number; nick: string }>> {
  if (candidates.length === 0) return [];
  // MySQL's default collation is case-insensitive, so @SPOT matches spot, and
  // users.nick is unique-indexed -- this is one indexed lookup.
  return prisma.users.findMany({
    where: { nick: { in: candidates } },
    select: { id: true, nick: true },
  });
}

// --- writes ---------------------------------------------------------------

/**
 * Insert a topic and its opening post, then bump the board's counters. All in
 * one transaction: a topic without its first post would render as an empty
 * thread that can never be repaired.
 */
export async function createTopic(args: {
  boardId: number;
  userId: number;
  title: string;
  body: string;
  ansiB64?: string | null;
  ansiFont?: string | null;
}): Promise<{ topicId: number; postId: number; slug: string }> {
  const now = nowSec();
  return prisma.$transaction(async tx => {
    const topic = await tx.forum_topics.create({
      data: {
        board_id: args.boardId,
        slug: "",
        title: args.title,
        user_id: args.userId,
        post_count: 1,
        last_post_at: now,
        last_user_id: args.userId,
        created_at: now,
        updated_at: now,
      },
      select: { id: true },
    });
    // The slug embeds the id, so it can only be written once the row exists.
    const slug = topicSlug(args.title, topic.id);
    const post = await tx.forum_posts.create({
      data: {
        topic_id: topic.id,
        board_id: args.boardId,
        user_id: args.userId,
        body: args.body,
        ansi_b64: args.ansiB64 ?? null,
        ansi_font: args.ansiFont ?? null,
        created_at: now,
      },
      select: { id: true },
    });
    await tx.forum_topics.update({
      where: { id: topic.id },
      data: { slug, first_post_id: post.id, last_post_id: post.id },
    });
    await tx.forum_boards.update({
      where: { id: args.boardId },
      data: {
        topic_count: { increment: 1 },
        post_count: { increment: 1 },
        last_topic_id: topic.id,
        last_post_id: post.id,
        last_post_at: now,
        last_user_id: args.userId,
        updated_at: now,
      },
    });
    return { topicId: topic.id, postId: post.id, slug };
  });
}

export async function createPost(args: {
  topicId: number;
  boardId: number;
  userId: number;
  body: string;
  ansiB64?: string | null;
  ansiFont?: string | null;
}): Promise<{ postId: number }> {
  const now = nowSec();
  return prisma.$transaction(async tx => {
    const post = await tx.forum_posts.create({
      data: {
        topic_id: args.topicId,
        board_id: args.boardId,
        user_id: args.userId,
        body: args.body,
        ansi_b64: args.ansiB64 ?? null,
        ansi_font: args.ansiFont ?? null,
        created_at: now,
      },
      select: { id: true },
    });
    await tx.forum_topics.update({
      where: { id: args.topicId },
      data: {
        post_count: { increment: 1 },
        last_post_id: post.id,
        last_post_at: now,
        last_user_id: args.userId,
        updated_at: now,
      },
    });
    await tx.forum_boards.update({
      where: { id: args.boardId },
      data: {
        post_count: { increment: 1 },
        last_topic_id: args.topicId,
        last_post_id: post.id,
        last_post_at: now,
        last_user_id: args.userId,
        updated_at: now,
      },
    });
    return { postId: post.id };
  });
}

export async function editPost(postId: number, body: string, editorId: number): Promise<void> {
  await prisma.forum_posts.update({
    where: { id: postId },
    data: { body, edited_at: nowSec(), edited_by_id: editorId, edit_count: { increment: 1 } },
  });
}

/**
 * Soft-delete a post and repair the counters it was part of. Recomputed from
 * the live rows rather than decremented, so a counter that had already drifted
 * comes back correct instead of drifting further.
 */
export async function softDeletePost(postId: number, byUserId: number): Promise<void> {
  const now = nowSec();
  await prisma.$transaction(async tx => {
    const post = await tx.forum_posts.update({
      where: { id: postId },
      data: { deleted_at: now, deleted_by_id: byUserId },
      select: { topic_id: true, board_id: true },
    });
    const topic = await tx.forum_topics.findUnique({
      where: { id: post.topic_id },
      select: { created_at: true },
    });
    const rows = await tx.forum_posts.findMany({ where: { topic_id: post.topic_id } });
    const c = recomputeTopicCounters(
      rows.map(r => toPost(r, null)),
      topic?.created_at ?? now,
    );
    await tx.forum_topics.update({
      where: { id: post.topic_id },
      data: {
        post_count: c.postCount,
        first_post_id: c.firstPostId,
        last_post_id: c.lastPostId,
        last_post_at: c.lastPostAt ?? now,
        last_user_id: c.lastUserId,
        updated_at: now,
      },
    });
    await resyncBoardInTx(tx, post.board_id, now);
  });
}

export async function softDeleteTopic(topicId: number, byUserId: number): Promise<void> {
  const now = nowSec();
  await prisma.$transaction(async tx => {
    const topic = await tx.forum_topics.update({
      where: { id: topicId },
      data: { deleted_at: now, deleted_by_id: byUserId, updated_at: now },
      select: { board_id: true },
    });
    await resyncBoardInTx(tx, topic.board_id, now);
  });
}

export async function setTopicState(topicId: number, state: { pinned?: boolean; locked?: boolean }): Promise<void> {
  await prisma.forum_topics.update({
    where: { id: topicId },
    data: { ...state, updated_at: nowSec() },
  });
}

export async function bumpViewCount(topicId: number): Promise<void> {
  // Best effort. A lost view is not worth failing a page render over.
  try {
    await prisma.forum_topics.update({ where: { id: topicId }, data: { view_count: { increment: 1 } } });
  } catch {
    /* ignore */
  }
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function resyncBoardInTx(tx: Tx, boardId: number, now: number): Promise<void> {
  const rows = await tx.forum_topics.findMany({ where: { board_id: boardId } });
  const c = recomputeBoardCounters(rows.map(r => toTopic(r, null, null)));
  const newest = c.lastTopicId != null ? rows.find(t => t.id === c.lastTopicId) : undefined;
  await tx.forum_boards.update({
    where: { id: boardId },
    data: {
      topic_count: c.topicCount,
      post_count: c.postCount,
      last_topic_id: c.lastTopicId,
      last_post_id: newest?.last_post_id ?? null,
      last_post_at: c.lastPostAt,
      last_user_id: newest?.last_user_id ?? null,
      updated_at: now,
    },
  });
}

/** Repair one board's counters from its live rows. Admin-triggered. */
export async function resyncBoardCounters(boardId: number): Promise<void> {
  await prisma.$transaction(async tx => resyncBoardInTx(tx, boardId, nowSec()));
}
