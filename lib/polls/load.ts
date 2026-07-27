// Server-only helpers that load a poll + (optionally) the current user's
// votes and aggregated results. Centralises the "convert Prisma row → view
// shape" step so the public page, hero widget, and sidebar widget share it.

import "server-only";
import { prisma } from "@/lib/db";
import type { PollView, PollResults as Results, PollConfig } from "./types";
import { aggregate } from "./aggregate";
import { effectivePollStatus, livePollWhere, nowSec } from "./state";

interface LoadedPoll {
  poll: PollView;
  myVotes: Array<{ option_id: number; vote_value: number | null }>;
  results: Results;
  canSeeResults: boolean;
}

function toView(row: NonNullable<Awaited<ReturnType<typeof prisma.polls.findUnique>>> & {
  options: Array<{ id: number; label: string; color_idx: number; sort_order: number; approved: boolean; created_by_id: number | null }>;
}): PollView {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    body: row.body,
    type: row.type,
    status: row.status,
    effective_status: effectivePollStatus(row, nowSec()),
    featured: row.featured,
    created_by_id: row.created_by_id,
    opens_at: row.opens_at,
    closes_at: row.closes_at,
    config: (row.config as PollConfig | null) ?? {},
    show_results: row.show_results,
    result_layout: row.result_layout,
    created_at: row.created_at,
    updated_at: row.updated_at,
    options: row.options.map(o => ({
      id: o.id,
      label: o.label,
      color_idx: o.color_idx,
      sort_order: o.sort_order,
      approved: o.approved,
      created_by_id: o.created_by_id,
    })),
  };
}

export async function loadPollBySlug(slug: string, userId: number | null): Promise<LoadedPoll | null> {
  const row = await prisma.polls.findUnique({
    where: { slug },
    include: { options: { orderBy: { sort_order: "asc" } } },
  });
  if (!row) return null;
  return loadFromRow(row, userId);
}

export async function loadPollById(id: number, userId: number | null): Promise<LoadedPoll | null> {
  const row = await prisma.polls.findUnique({
    where: { id },
    include: { options: { orderBy: { sort_order: "asc" } } },
  });
  if (!row) return null;
  return loadFromRow(row, userId);
}

export async function loadFeaturedPoll(userId: number | null): Promise<LoadedPoll | null> {
  // Polls this user has answered and then dismissed. Excluded in the query
  // rather than after it, so a dismissed poll does not suppress the hero
  // entirely when another featured poll is available.
  const hidden = userId
    ? await prisma.$queryRaw<Array<{ poll_id: number }>>`
        SELECT poll_id FROM poll_hidden WHERE user_id = ${userId}
      `
    : [];
  const hiddenIds = hidden.map(h => Number(h.poll_id));

  const row = await prisma.polls.findFirst({
    where: {
      featured: true,
      ...livePollWhere(nowSec()),
      ...(hiddenIds.length > 0 ? { id: { notIn: hiddenIds } } : {}),
    },
    orderBy: { updated_at: "desc" },
    include: { options: { orderBy: { sort_order: "asc" } } },
  });
  if (!row) return null;
  return loadFromRow(row, userId);
}

export async function loadLatestClosedPoll(userId: number | null): Promise<LoadedPoll | null> {
  const row = await prisma.polls.findFirst({
    where: { status: "closed" },
    orderBy: { updated_at: "desc" },
    include: { options: { orderBy: { sort_order: "asc" } } },
  });
  if (!row) return null;
  return loadFromRow(row, userId);
}

async function loadFromRow(
  row: NonNullable<Awaited<ReturnType<typeof prisma.polls.findUnique>>> & {
    options: Array<{ id: number; label: string; color_idx: number; sort_order: number; approved: boolean; created_by_id: number | null }>;
  },
  userId: number | null,
): Promise<LoadedPoll> {
  const poll = toView(row);
  const allVotes = await prisma.poll_votes.findMany({
    where: { poll_id: poll.id },
    select: { user_id: true, option_id: true, vote_value: true },
  });
  const myVotes = userId
    ? allVotes
        .filter(v => v.user_id === userId)
        .map(v => ({ option_id: v.option_id, vote_value: v.vote_value }))
    : [];
  const results = aggregate({
    type: poll.type,
    config: poll.config,
    options: poll.options,
    votes: allVotes,
  });
  const hasVoted = myVotes.length > 0;
  const canSeeResults =
    poll.show_results === "always" ||
    (poll.show_results === "after_vote" && hasVoted) ||
    (poll.show_results === "after_close" && poll.effective_status === "closed");
  return { poll, myVotes, results, canSeeResults };
}
