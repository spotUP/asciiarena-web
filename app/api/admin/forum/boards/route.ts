import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk, urlsafe } from "@/lib/utils";
import { broadcast } from "@/lib/live";
import { normalizeMessageText } from "@/lib/normalizeText";
import { RANKS } from "@/lib/accountRules";

export const dynamic = "force-dynamic";

// "" means "no rank required" for min_read_rank; it is stored as NULL.
const rank = z.enum(RANKS as unknown as [string, ...string[]]);

const boardSchema = z.object({
  name: z.string().trim().min(1).max(120).transform(normalizeMessageText),
  slug: z.string().trim().max(96).optional(),
  description: z.string().trim().max(255).default("").transform(normalizeMessageText),
  sortOrder: z.number().int().min(-999).max(999).default(0),
  minReadRank: rank.nullable().default(null),
  minPostRank: rank.default("Member"),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
});

async function requireAdmin() {
  const session = await auth();
  return session?.user?.rank === "Admin";
}

export async function GET() {
  if (!(await requireAdmin())) return apiError("Forbidden", 403);
  const boards = await prisma.forum_boards.findMany({ orderBy: [{ sort_order: "asc" }, { id: "asc" }] });
  return apiOk({ boards });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return apiError("Forbidden", 403);

  const parsed = boardSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiError("Invalid request", 400);
  const d = parsed.data;

  const slug = urlsafe(d.slug?.trim() || d.name).slice(0, 96);
  if (!slug) return apiError("Give the board a name that produces a URL", 400);
  if (await prisma.forum_boards.findUnique({ where: { slug }, select: { id: true } })) {
    return apiError("A board with that URL already exists", 409);
  }

  const now = Math.floor(Date.now() / 1000);
  const board = await prisma.forum_boards.create({
    data: {
      slug,
      name: d.name,
      description: d.description,
      sort_order: d.sortOrder,
      min_read_rank: d.minReadRank || null,
      min_post_rank: d.minPostRank,
      locked: d.locked,
      hidden: d.hidden,
      created_at: now,
      updated_at: now,
    },
    select: { id: true, slug: true },
  });

  broadcast("site:forum", { type: "config", boardId: board.id });
  return apiOk({ ok: true, board });
}
