import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { apiError, apiOk } from "@/lib/utils";

export const dynamic = "force-dynamic";

// POST — record that this member has seen an announcement, so the bar never
// shows it to them again. Anonymous visitors do not call this: their state
// lives in localStorage, and creating rows for them would need an identity
// they have not given.
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession().catch(() => null);
  if (!session?.user?.id) return apiOk({ ok: true, tracked: false });

  const { id } = await ctx.params;
  const newsId = parseInt(id);
  if (!Number.isFinite(newsId)) return apiError("Bad news id", 400);
  const userId = Number(session.user.id);

  // INSERT IGNORE against the (news_id, user_id) unique key: marking the same
  // item read twice is normal (two tabs, a quick reload) and is not an error.
  await prisma.$executeRaw`
    INSERT IGNORE INTO news_reads (news_id, user_id, read_at)
    VALUES (${newsId}, ${userId}, UNIX_TIMESTAMP())
  `;

  return apiOk({ ok: true, tracked: true });
}
