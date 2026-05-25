import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { apiOk } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<{ filename: string; nick: string; comment: string }[]>(
      Prisma.sql`
        SELECT
          COALESCE(c.filename, co.filename) AS filename,
          COALESCE(c.nick, u.nick, 'unknown') AS nick,
          CASE WHEN CHAR_LENGTH(c.comment) = 0
            THEN CONCAT(COALESCE(c.nick, u.nick, 'unknown'), ' voted ', c.rating)
            ELSE c.comment
          END AS comment
        FROM comments c
        LEFT JOIN collys co ON co.id = c.colly_id
        LEFT JOIN users u ON u.id = c.user_id
        WHERE COALESCE(c.filename, co.filename) IS NOT NULL
        ORDER BY c.timestamp DESC
        LIMIT 10
      `
    );
    return apiOk(rows);
  } catch {
    return apiOk([]);
  }
}
