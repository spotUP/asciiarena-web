import { NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  ABANDONED_REGISTRATION_DAYS,
  ACTIVATION_FLOW_EPOCH,
  INACTIVE_RANK,
} from "@/lib/accountRules";

export const dynamic = "force-dynamic";

/**
 * Delete abandoned registrations: accounts sent an activation mail that never
 * activated, a week on. Those are spam signups -- a real person either clicks
 * the link or writes in.
 *
 * GET  -> what WOULD be deleted. Always available, always safe.
 * POST -> delete them.
 *
 * Authorised by admin rank or the REINDEX_SECRET token, matching the other
 * admin tools here, so it can run from cron on the host.
 *
 * Two guards, because this is irreversible:
 *
 *  1. It never reaches back before ACTIVATION_FLOW_EPOCH. Registration stamped
 *     "Inactive" for two months before the activation flow existed, so those
 *     accounts were never sent a link and could never have activated. Several
 *     turned out to be real people. That backlog was sorted out by hand.
 *  2. It never deletes an account that has left anything behind -- a comment, a
 *     forum post, an upload. A spam signup has none of that, so the check costs
 *     nothing; if it ever does fire, the assumption was wrong and the account
 *     stays.
 */
async function authorized(req: NextRequest): Promise<boolean> {
  const token = req.nextUrl.searchParams.get("token");
  if (token && process.env.REINDEX_SECRET && token === process.env.REINDEX_SECRET) return true;
  const session = await auth();
  return session?.user?.rank === "Admin";
}

interface Candidate {
  id: number;
  nick: string;
  mail: string | null;
  joined: number | null;
  comment_count: number;
  post_count: number;
  uploaded: number;
}

/**
 * Accounts matching the rule AND carrying nothing. The content counts are part
 * of the query rather than a later filter so the preview and the delete cannot
 * disagree about what qualifies.
 */
async function findCandidates(): Promise<Candidate[]> {
  const cutoff = Math.floor(Date.now() / 1000) - ABANDONED_REGISTRATION_DAYS * 24 * 3600;
  const rows = await prisma.$queryRaw<Candidate[]>`
    SELECT u.id, u.nick, u.mail, u.joined, u.uploaded,
           (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id) AS comment_count,
           (SELECT COUNT(*) FROM forum_posts p WHERE p.user_id = u.id) AS post_count
    FROM users u
    WHERE u.rank = ${INACTIVE_RANK}
      AND u.joined >= ${ACTIVATION_FLOW_EPOCH}
      AND u.joined < ${cutoff}
    ORDER BY u.joined ASC
  `;
  return rows
    .map(r => ({
      ...r,
      id: Number(r.id),
      comment_count: Number(r.comment_count),
      post_count: Number(r.post_count),
      uploaded: Number(r.uploaded),
    }))
    .filter(r => r.comment_count === 0 && r.post_count === 0 && r.uploaded === 0);
}

export async function GET(req: NextRequest) {
  if (!(await authorized(req))) return new Response("forbidden", { status: 403 });
  const candidates = await findCandidates();
  return Response.json({
    wouldDelete: candidates.length,
    olderThanDays: ABANDONED_REGISTRATION_DAYS,
    accounts: candidates.map(c => ({ id: c.id, nick: c.nick, mail: c.mail, joined: c.joined })),
  });
}

export async function POST(req: NextRequest) {
  if (!(await authorized(req))) return new Response("forbidden", { status: 403 });

  const candidates = await findCandidates();
  if (candidates.length === 0) return Response.json({ deleted: 0, accounts: [] });

  const ids = candidates.map(c => c.id);
  // Deleted by explicit id list, not by re-running the predicate as a DELETE
  // ... WHERE. The rows were already inspected; re-evaluating the condition at
  // write time could catch something that changed in between.
  await prisma.$executeRaw`DELETE FROM users WHERE id IN (${Prisma.join(ids)})`;

  return Response.json({
    deleted: ids.length,
    accounts: candidates.map(c => ({ id: c.id, nick: c.nick, mail: c.mail })),
  });
}
