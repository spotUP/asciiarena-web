// Existence checks that must run ABOVE a streaming boundary.
//
// A segment with a loading.tsx wraps its page in a Suspense boundary. The
// moment that fallback renders, the response has begun: headers and status are
// already on the wire, and a notFound() thrown later can only swap in the
// not-found UI. Next serves it as 200 with a noindex tag. Measured on
// Next 16.2.6: notFound() in the page returns 200, in generateMetadata returns
// 200 (metadata streams too), in the segment's layout returns a real 404.
//
// So every dynamic segment that can 404 and has a loading.tsx in its chain
// carries a layout.tsx that calls one of these first. The page keeps its own
// notFound() -- this is a guard, not a replacement, and the page's richer
// queries stay inside the boundary where the skeleton covers them.
//
// Each check is the cheapest indexed lookup that answers "does it exist", and
// is wrapped in React's cache() so a layout and anything else asking the same
// question in the same request share one query.

import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { decodeParam } from "@/lib/utils";
import { parseTopicId } from "@/lib/forum/slug";

export const requireMember = cache(async (rawNick: string): Promise<void> => {
  const nickurl = decodeParam(rawNick);
  const row = await prisma.users.findFirst({ where: { nickurl }, select: { id: true } });
  if (!row) notFound();
});

export const requireArtist = cache(async (rawNick: string): Promise<void> => {
  const artisturl = decodeParam(rawNick);
  const row = await prisma.artists.findFirst({ where: { artisturl }, select: { id: true } });
  if (!row) notFound();
});

export const requireCrew = cache(async (rawName: string): Promise<void> => {
  const crewurl = decodeParam(rawName);
  const row = await prisma.crews.findFirst({ where: { crewurl }, select: { id: true } });
  if (!row) notFound();
});

export const requireColly = cache(async (rawFilename: string): Promise<void> => {
  // Same normalisation the page applies, or the guard would answer a different
  // question than the page does.
  const filename = decodeParam(rawFilename).replace(/\.\./g, "").replace(/[/\\]/g, "");
  const row = await prisma.collys.findFirst({ where: { filename }, select: { id: true } });
  if (!row) notFound();
});

export const requireForumBoard = cache(async (slug: string): Promise<void> => {
  const row = await prisma.forum_boards.findUnique({ where: { slug }, select: { id: true } });
  if (!row) notFound();
});

export const requireForumTopic = cache(async (boardSlug: string, topicParam: string): Promise<void> => {
  // The id suffix is the identity; the words in front of it are decoration.
  const topicId = parseTopicId(topicParam);
  if (!topicId) notFound();
  const topic = await prisma.forum_topics.findUnique({
    where: { id: topicId },
    select: { board_id: true },
  });
  if (!topic) notFound();
  const board = await prisma.forum_boards.findUnique({
    where: { id: topic.board_id },
    select: { slug: true },
  });
  // A topic reached through the wrong board's URL is not that board's topic.
  if (!board || board.slug !== boardSlug) notFound();
});

export const requireRequest = cache(async (rawId: string): Promise<void> => {
  const id = parseInt(rawId);
  if (!Number.isFinite(id) || id <= 0) notFound();
  const row = await prisma.requests.findUnique({ where: { id }, select: { id: true } });
  if (!row) notFound();
});

export const requireBbs = cache(async (rawId: string): Promise<void> => {
  const id = parseInt(rawId);
  if (!Number.isFinite(id) || id <= 0) notFound();
  const row = await prisma.bbses.findUnique({ where: { id }, select: { id: true } });
  if (!row) notFound();
});
