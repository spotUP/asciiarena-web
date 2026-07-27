import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { normalizeMessageText } from "@/lib/normalizeText";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().trim().min(1).max(200).transform(normalizeMessageText),
  body: z.string().trim().min(1).max(20000).transform(normalizeMessageText),
  published: z.boolean().optional(),
  banner: z.boolean().optional(),
});

// Every field optional: the editor sends only what changed. `null` is not
// accepted anywhere here, so there is no ambiguity between "leave alone" and
// "clear" — the columns are all NOT NULL.
const updateSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().trim().min(1).max(200).transform(normalizeMessageText).optional(),
  body: z.string().trim().min(1).max(20000).transform(normalizeMessageText).optional(),
  published: z.boolean().optional(),
  banner: z.boolean().optional(),
});

const deleteSchema = z.object({ id: z.number().int().positive() });

async function requireAdmin() {
  const session = await auth();
  const rank = (session?.user as { rank?: string } | undefined)?.rank;
  if (rank !== "Admin") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) return apiError("Forbidden", 403);

  const rows = await prisma.$queryRaw<Array<{
    id: number; title: string; body: string; published: number | boolean;
    banner: number | boolean; created_at: number; updated_at: number;
    author: string | null; reads: bigint | number;
  }>>`
    SELECT n.id, n.title, n.body, n.published, n.banner, n.created_at, n.updated_at,
           (SELECT u.nick FROM users u WHERE u.id = n.created_by_id) AS author,
           (SELECT COUNT(*) FROM news_reads r WHERE r.news_id = n.id) AS reads
    FROM news n
    ORDER BY n.created_at DESC, n.id DESC
    LIMIT 200
  `;

  return apiOk(rows.map(r => ({
    ...r,
    published: !!r.published,
    banner: !!r.banner,
    reads: Number(r.reads),
  })));
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return apiError("Forbidden", 403);

  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);
  const { title, body, published = false, banner = true } = parsed.data;
  const authorId = Number((session.user as { id?: string }).id);

  await prisma.$executeRaw`
    INSERT INTO news (title, body, published, banner, created_by_id, created_at, updated_at)
    VALUES (${title}, ${body}, ${published ? 1 : 0}, ${banner ? 1 : 0},
            ${Number.isFinite(authorId) ? authorId : null}, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
  `;
  const [row] = await prisma.$queryRaw<[{ id: number }]>`SELECT LAST_INSERT_ID() AS id`;

  return apiOk({ ok: true, id: Number(row?.id ?? 0) });
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin())) return apiError("Forbidden", 403);

  const parsed = updateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);
  const { id, title, body, published, banner } = parsed.data;

  // Each column is written only when the field was actually sent. COALESCE
  // would conflate "not sent" with a legitimately falsy value — that is how
  // unpublishing an item would silently do nothing.
  if (title !== undefined) await prisma.$executeRaw`UPDATE news SET title = ${title} WHERE id = ${id}`;
  if (body !== undefined) await prisma.$executeRaw`UPDATE news SET body = ${body} WHERE id = ${id}`;
  if (published !== undefined) await prisma.$executeRaw`UPDATE news SET published = ${published ? 1 : 0} WHERE id = ${id}`;
  if (banner !== undefined) await prisma.$executeRaw`UPDATE news SET banner = ${banner ? 1 : 0} WHERE id = ${id}`;
  await prisma.$executeRaw`UPDATE news SET updated_at = UNIX_TIMESTAMP() WHERE id = ${id}`;

  return apiOk({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin())) return apiError("Forbidden", 403);

  const parsed = deleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiError("Invalid request", 400);

  // The read markers are meaningless without the item they refer to.
  await prisma.$executeRaw`DELETE FROM news_reads WHERE news_id = ${parsed.data.id}`;
  await prisma.$executeRaw`DELETE FROM news WHERE id = ${parsed.data.id}`;

  return apiOk({ ok: true });
}
