import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk, urlsafe } from "@/lib/utils";
import { broadcast } from "@/lib/live";
import { normalizeMessageText } from "@/lib/normalizeText";
import { RANKS } from "@/lib/accountRules";
import { resyncBoardCounters } from "@/lib/forum/db";

export const dynamic = "force-dynamic";

const rank = z.enum(RANKS as unknown as [string, ...string[]]);

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).transform(normalizeMessageText).optional(),
  slug: z.string().trim().max(96).optional(),
  description: z.string().trim().max(255).transform(normalizeMessageText).optional(),
  sortOrder: z.number().int().min(-999).max(999).optional(),
  minReadRank: rank.nullable().optional(),
  minPostRank: rank.optional(),
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
  /** Repair drifted counters from the live rows. */
  resync: z.boolean().optional(),
});

async function requireAdmin() {
  const session = await auth();
  return session?.user?.rank === "Admin";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return apiError("Forbidden", 403);
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return apiError("Invalid board", 400);

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiError("Invalid request", 400);
  const d = parsed.data;

  if (d.resync) {
    await resyncBoardCounters(id);
    broadcast("site:forum", { type: "config", boardId: id });
    return apiOk({ ok: true });
  }

  let slug: string | undefined;
  if (d.slug !== undefined || d.name !== undefined) {
    slug = urlsafe(d.slug?.trim() || d.name || "").slice(0, 96) || undefined;
    if (slug) {
      const clash = await prisma.forum_boards.findUnique({ where: { slug }, select: { id: true } });
      if (clash && clash.id !== id) return apiError("A board with that URL already exists", 409);
    }
  }

  await prisma.forum_boards.update({
    where: { id },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(slug ? { slug } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.sortOrder !== undefined ? { sort_order: d.sortOrder } : {}),
      ...(d.minReadRank !== undefined ? { min_read_rank: d.minReadRank || null } : {}),
      ...(d.minPostRank !== undefined ? { min_post_rank: d.minPostRank } : {}),
      ...(d.locked !== undefined ? { locked: d.locked } : {}),
      ...(d.hidden !== undefined ? { hidden: d.hidden } : {}),
      updated_at: Math.floor(Date.now() / 1000),
    },
  });

  broadcast("site:forum", { type: "config", boardId: id });
  return apiOk({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return apiError("Forbidden", 403);
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return apiError("Invalid board", 400);

  // Cascades to topics and their posts by foreign key. This is the one place
  // forum content is destroyed rather than soft-deleted, which is why the UI
  // asks for confirmation naming the board.
  await prisma.forum_boards.delete({ where: { id } });
  broadcast("site:forum", { type: "config", boardId: id });
  return apiOk({ ok: true });
}
