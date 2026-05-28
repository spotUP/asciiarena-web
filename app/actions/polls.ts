"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { broadcast } from "@/lib/live";
import { revalidatePath } from "next/cache";
import type { VotePayload, PollOptionView } from "@/lib/polls/types";
import { validateVote, isSingleVoteType } from "@/lib/polls/cast";

interface ActionResult {
  ok: boolean;
  error?: string;
}

const nowSec = () => Math.floor(Date.now() / 1000);

export async function castVoteAction(pollId: number, payload: VotePayload): Promise<ActionResult> {
  const session = await getSession();
  if (!session?.user?.id) return { ok: false, error: "Not logged in" };
  const userId = Number(session.user.id);

  const poll = await prisma.polls.findUnique({
    where: { id: pollId },
    include: { options: { orderBy: { sort_order: "asc" } } },
  });
  if (!poll) return { ok: false, error: "Poll not found" };
  if (poll.status !== "open") return { ok: false, error: "Voting is closed" };

  // For text_suggest with new_label: create the option first so the validation
  // step can include it. Bounded length, trim, deduplicate against existing.
  let options: PollOptionView[] = poll.options.map(o => ({
    id: o.id,
    label: o.label,
    color_idx: o.color_idx,
    sort_order: o.sort_order,
    approved: o.approved,
    created_by_id: o.created_by_id,
  }));

  if (poll.type === "text_suggest" && payload.type === "text_suggest" && payload.new_label) {
    const label = payload.new_label.trim().slice(0, 200);
    if (label.length > 0) {
      const existing = options.find(o => o.label.toLowerCase() === label.toLowerCase());
      if (existing) {
        // Treat as an upvote on the duplicate.
        if (!payload.upvote_ids.includes(existing.id)) {
          payload.upvote_ids = [...payload.upvote_ids, existing.id];
        }
      } else {
        const cfg = (poll.config as { allow_user_options?: boolean } | null) ?? {};
        if (!cfg.allow_user_options) return { ok: false, error: "User suggestions are disabled" };
        const created = await prisma.poll_options.create({
          data: {
            poll_id: poll.id,
            label,
            color_idx: 7,
            sort_order: options.length,
            created_by_id: userId,
            approved: true, // moderation toggle could downgrade this in future
          },
        });
        const view: PollOptionView = {
          id: created.id, label: created.label, color_idx: created.color_idx,
          sort_order: created.sort_order, approved: created.approved,
          created_by_id: created.created_by_id,
        };
        options = [...options, view];
        payload.upvote_ids = [...payload.upvote_ids, created.id];
      }
    }
  }

  const validation = validateVote(
    { type: poll.type, config: (poll.config as Parameters<typeof validateVote>[0]["config"]) ?? null },
    options,
    payload,
  );
  if (!validation.ok) return { ok: false, error: validation.error };

  const t = nowSec();
  // One transaction: replace existing votes by this user for this poll.
  // Cleanest semantics across all types and matches the unique constraint.
  await prisma.$transaction(async (tx) => {
    await tx.poll_votes.deleteMany({ where: { poll_id: poll.id, user_id: userId } });
    if (validation.rows.length > 0) {
      await tx.poll_votes.createMany({
        data: validation.rows.map(r => ({
          poll_id: poll.id,
          user_id: userId,
          option_id: r.option_id,
          vote_value: r.vote_value,
          created_at: t,
          updated_at: t,
        })),
      });
    }
    // touch updated_at so admin lists sort by recent activity
    await tx.polls.update({ where: { id: poll.id }, data: { updated_at: t } });
  });

  broadcast(`poll:${poll.id}`, { type: "voted", nick: session.user.name ?? "" });
  revalidatePath(`/polls/${poll.slug}`);
  revalidatePath(`/polls`);
  revalidatePath(`/`);

  // Note: isSingleVoteType is exposed via the cast module — keep the import
  // used so tree-shaking doesn't complain.
  void isSingleVoteType;

  return { ok: true };
}

export async function retractVoteAction(pollId: number): Promise<ActionResult> {
  const session = await getSession();
  if (!session?.user?.id) return { ok: false, error: "Not logged in" };
  const userId = Number(session.user.id);

  const poll = await prisma.polls.findUnique({ where: { id: pollId }, select: { id: true, slug: true, status: true } });
  if (!poll) return { ok: false, error: "Poll not found" };
  if (poll.status !== "open") return { ok: false, error: "Voting is closed" };

  await prisma.poll_votes.deleteMany({ where: { poll_id: poll.id, user_id: userId } });
  broadcast(`poll:${poll.id}`, { type: "voted", nick: session.user.name ?? "" });
  revalidatePath(`/polls/${poll.slug}`);
  revalidatePath(`/polls`);
  revalidatePath(`/`);
  return { ok: true };
}
