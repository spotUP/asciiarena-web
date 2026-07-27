import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { apiOk } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Candidates for the announcement bar.
//
// For a logged-in member the "already seen" state is in news_reads, so the
// query can return just their newest unread item. An anonymous visitor keeps
// that state in localStorage, which the server cannot see, so they get the
// recent window and the client filters it — one shared rule, pickBannerItem().
const ANON_WINDOW = 10;

export async function GET() {
  const session = await getSession().catch(() => null);
  const userId = session?.user?.id ? Number(session.user.id) : null;

  if (userId) {
    const rows = await prisma.$queryRaw<Array<{
      id: number; title: string; body: string; created_at: number; banner: number | boolean;
    }>>`
      SELECT n.id, n.title, n.body, n.created_at, n.banner
      FROM news n
      WHERE n.published = 1 AND n.banner = 1
        AND NOT EXISTS (SELECT 1 FROM news_reads r WHERE r.news_id = n.id AND r.user_id = ${userId})
      ORDER BY n.created_at DESC, n.id DESC
      LIMIT 1
    `;
    return apiOk({
      tracked: true,
      items: rows.map(r => ({ ...r, banner: !!r.banner })),
    });
  }

  const rows = await prisma.$queryRaw<Array<{
    id: number; title: string; body: string; created_at: number; banner: number | boolean;
  }>>`
    SELECT id, title, body, created_at, banner
    FROM news
    WHERE published = 1 AND banner = 1
    ORDER BY created_at DESC, id DESC
    LIMIT ${ANON_WINDOW}
  `;
  return apiOk({
    tracked: false,
    items: rows.map(r => ({ ...r, banner: !!r.banner })),
  });
}
