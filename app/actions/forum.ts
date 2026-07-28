"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { normalizeMessageText } from "@/lib/normalizeText";
import * as db from "@/lib/forum/db";
import { announceNewPost, announceNewTopic, broadcastBoard, broadcastTopic } from "@/lib/forum/notify";
import {
  canDeletePost,
  canDeleteTopic,
  canEditPost,
  canModerate,
  canPostInBoard,
  canReplyToTopic,
} from "@/lib/forum/rules";
import { MAX_BODY_LEN, MAX_TITLE_LEN, MIN_TITLE_LEN, type ForumViewer } from "@/lib/forum/types";

type Result = { success: boolean; error?: string; topicSlug?: string; boardSlug?: string };

const title = z.string().trim().min(MIN_TITLE_LEN).max(MAX_TITLE_LEN).transform(normalizeMessageText);
const body = z.string().trim().min(1).max(MAX_BODY_LEN).transform(normalizeMessageText);
const id = z.number().int().positive();

async function viewer(): Promise<{ v: ForumViewer; nick: string } | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return {
    v: { userId: Number(session.user.id), rank: session.user.rank ?? null },
    nick: session.user.name ?? "",
  };
}

export async function createTopic(boardSlug: string, rawTitle: string, rawBody: string): Promise<Result> {
  const who = await viewer();
  if (!who) return { success: false, error: "You must be logged in to post." };

  const parsed = z.object({ title, body }).safeParse({ title: rawTitle, body: rawBody });
  if (!parsed.success) return { success: false, error: "Give the topic a title and something to say." };

  const board = await db.getBoardBySlug(boardSlug);
  if (!board) return { success: false, error: "That board does not exist." };
  if (!canPostInBoard(board, who.v)) return { success: false, error: "You cannot start a topic in this board." };

  if (!checkRateLimit(`forum:topic:${who.v.userId}`, 5, 600_000)) {
    return { success: false, error: "You are posting too fast. Wait a moment and try again." };
  }

  const created = await db.createTopic({
    boardId: board.id,
    userId: who.v.userId!,
    title: parsed.data.title,
    body: parsed.data.body,
  });

  const topic = await db.getTopic(created.topicId);
  if (topic) {
    await announceNewTopic({
      board,
      topic,
      postId: created.postId,
      actorId: who.v.userId!,
      actorNick: who.nick,
    });
  }

  revalidatePath("/forum");
  revalidatePath(`/forum/${board.slug}`);
  return { success: true, topicSlug: created.slug, boardSlug: board.slug };
}

export async function postReply(topicId: number, rawBody: string): Promise<Result> {
  const who = await viewer();
  if (!who) return { success: false, error: "You must be logged in to reply." };

  const parsed = z.object({ topicId: id, body }).safeParse({ topicId, body: rawBody });
  if (!parsed.success) return { success: false, error: "Write something before you post." };

  const topic = await db.getTopic(parsed.data.topicId);
  if (!topic) return { success: false, error: "That topic does not exist." };
  const board = await db.getBoardById(topic.boardId);
  if (!board) return { success: false, error: "That board does not exist." };
  if (!canReplyToTopic(topic, board, who.v)) {
    return { success: false, error: "This topic is locked. New replies are turned off." };
  }

  if (!checkRateLimit(`forum:post:${who.v.userId}`, 20, 600_000)) {
    return { success: false, error: "You are posting too fast. Wait a moment and try again." };
  }

  const { postId } = await db.createPost({
    topicId: topic.id,
    boardId: board.id,
    userId: who.v.userId!,
    body: parsed.data.body,
  });

  await announceNewPost({
    board,
    topic,
    postId,
    actorId: who.v.userId!,
    actorNick: who.nick,
    body: parsed.data.body,
  });

  revalidatePath(`/forum/${board.slug}/${topic.slug}`);
  revalidatePath(`/forum/${board.slug}`);
  return { success: true };
}

export async function editPost(postId: number, rawBody: string): Promise<Result> {
  const who = await viewer();
  if (!who) return { success: false, error: "You must be logged in to edit." };

  const parsed = z.object({ postId: id, body }).safeParse({ postId, body: rawBody });
  if (!parsed.success) return { success: false, error: "Write something before you save." };

  const post = await db.getPost(parsed.data.postId);
  if (!post) return { success: false, error: "That post does not exist." };
  if (!canEditPost(post, who.v, Math.floor(Date.now() / 1000))) {
    return { success: false, error: "You can only edit your own posts, and only for a short while." };
  }

  await db.editPost(post.id, parsed.data.body, who.v.userId!);
  // No activity event and no notification: an edit is not a new thing to read.
  broadcastTopic(post.topicId, { type: "edit", postId: post.id });

  const topic = await db.getTopic(post.topicId);
  const board = topic ? await db.getBoardById(topic.boardId) : null;
  if (topic && board) revalidatePath(`/forum/${board.slug}/${topic.slug}`);
  return { success: true };
}

export async function deletePost(postId: number): Promise<Result> {
  const who = await viewer();
  if (!who) return { success: false, error: "You must be logged in." };

  const post = await db.getPost(postId);
  if (!post) return { success: false, error: "That post does not exist." };
  if (!canDeletePost(post, who.v)) return { success: false, error: "You can only delete your own posts." };

  await db.softDeletePost(post.id, who.v.userId!);
  broadcastTopic(post.topicId, { type: "delete", postId: post.id });
  broadcastBoard(post.boardId, { type: "moderated" });

  const topic = await db.getTopic(post.topicId);
  const board = topic ? await db.getBoardById(topic.boardId) : null;
  if (topic && board) {
    revalidatePath(`/forum/${board.slug}/${topic.slug}`);
    revalidatePath(`/forum/${board.slug}`);
  }
  return { success: true };
}

export async function setTopicState(topicId: number, state: { pinned?: boolean; locked?: boolean }): Promise<Result> {
  const who = await viewer();
  if (!who || !canModerate(who.v)) return { success: false, error: "You do not have permission to do that." };

  const topic = await db.getTopic(topicId);
  if (!topic) return { success: false, error: "That topic does not exist." };

  await db.setTopicState(topic.id, state);
  broadcastTopic(topic.id, { type: "moderated" });
  broadcastBoard(topic.boardId, { type: "moderated" });

  const board = await db.getBoardById(topic.boardId);
  if (board) {
    revalidatePath(`/forum/${board.slug}`);
    revalidatePath(`/forum/${board.slug}/${topic.slug}`);
  }
  return { success: true };
}

export async function deleteTopic(topicId: number): Promise<Result> {
  const who = await viewer();
  if (!who) return { success: false, error: "You must be logged in." };

  const topic = await db.getTopic(topicId);
  if (!topic) return { success: false, error: "That topic does not exist." };
  if (!canDeleteTopic(topic, who.v)) return { success: false, error: "You do not have permission to do that." };

  await db.softDeleteTopic(topic.id, who.v.userId!);
  broadcastTopic(topic.id, { type: "moderated" });
  broadcastBoard(topic.boardId, { type: "moderated" });

  const board = await db.getBoardById(topic.boardId);
  if (board) {
    revalidatePath("/forum");
    revalidatePath(`/forum/${board.slug}`);
  }
  return { success: true, boardSlug: board?.slug };
}
