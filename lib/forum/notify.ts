import { broadcastActivityIfAllowed } from "@/lib/activity";
import { broadcast, type LiveEvent } from "@/lib/live";
import { createNotification } from "@/lib/notifications";
import { resolveMentionNicks } from "@/lib/forum/db";
import { extractMentionCandidates } from "@/lib/forum/mentions";
import { MAX_MENTIONS_PER_POST, type BoardView, type TopicView } from "@/lib/forum/types";

/**
 * Everything a forum write announces: SSE, the activity feed, notifications.
 *
 * Kept out of lib/forum/db.ts so a failed broadcast and a failed write are
 * separable — the post is already committed by the time any of this runs, and
 * createNotification swallows its own errors for the same reason.
 */

function postUrl(board: BoardView, topic: TopicView, postId: number): string {
  return `/forum/${board.slug}/${topic.slug}#p${postId}`;
}

export function broadcastBoard(boardId: number, event: LiveEvent): void {
  broadcast(`forum:board:${boardId}`, event);
}

export function broadcastTopic(topicId: number, event: LiveEvent): void {
  broadcast(`forum:topic:${topicId}`, event);
}

export async function announceNewTopic(args: {
  board: BoardView;
  topic: TopicView;
  postId: number;
  actorId: number;
  actorNick: string;
}): Promise<void> {
  broadcastBoard(args.board.id, { type: "topic", nick: args.actorNick });
  // The board index shows counters for every board, so it listens on one
  // shared channel rather than opening a stream per board. It is only ever
  // subscribed while /forum is the open page.
  broadcast("site:forum", { type: "topic", boardId: args.board.id });
  await broadcastActivityIfAllowed(args.actorId, "forum", {
    type: "forum",
    nick: args.actorNick,
    target: `${args.board.name} / ${args.topic.title}`,
    targetUrl: postUrl(args.board, args.topic, args.postId),
    timestamp: Math.floor(Date.now() / 1000),
  });
  await notifyMentions(args);
}

export async function announceNewPost(args: {
  board: BoardView;
  topic: TopicView;
  postId: number;
  actorId: number;
  actorNick: string;
  body: string;
}): Promise<void> {
  broadcastTopic(args.topic.id, { type: "posted", nick: args.actorNick, postId: args.postId });
  broadcastBoard(args.board.id, { type: "bump", nick: args.actorNick });
  broadcast("site:forum", { type: "post", boardId: args.board.id });
  await broadcastActivityIfAllowed(args.actorId, "forum", {
    type: "forum",
    nick: args.actorNick,
    target: `${args.board.name} / ${args.topic.title}`,
    targetUrl: postUrl(args.board, args.topic, args.postId),
    timestamp: Math.floor(Date.now() / 1000),
  });

  // The topic's author hears about the reply first, and is then removed from
  // the mention set — one event must never produce two notifications.
  const claimed = new Set<number>([args.actorId]);
  if (args.topic.userId !== args.actorId) {
    claimed.add(args.topic.userId);
    await createNotification(args.topic.userId, "notif-forum-reply", {
      actorNick: args.actorNick,
      target: args.topic.title,
      targetUrl: postUrl(args.board, args.topic, args.postId),
    });
  }
  await notifyMentions({ ...args, skip: claimed });
}

async function notifyMentions(args: {
  board: BoardView;
  topic: TopicView;
  postId: number;
  actorId: number;
  actorNick: string;
  body?: string;
  skip?: Set<number>;
}): Promise<void> {
  if (!args.body) return;
  const candidates = extractMentionCandidates(args.body);
  if (candidates.length === 0) return;

  const skip = args.skip ?? new Set<number>([args.actorId]);
  skip.add(args.actorId); // never notify yourself, whatever the caller passed

  const resolved = (await resolveMentionNicks(candidates))
    .filter(u => !skip.has(u.id))
    .slice(0, MAX_MENTIONS_PER_POST);

  for (const u of resolved) {
    await createNotification(u.id, "notif-mention", {
      actorNick: args.actorNick,
      target: args.topic.title,
      targetUrl: postUrl(args.board, args.topic, args.postId),
    });
  }
}
