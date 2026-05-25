import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

const postSchema = z.object({
  comment: z.string().min(1).max(5000),
  rating: z.number().int().min(1).max(10).nullable().optional(),
});

interface CommentRow {
  commentid: number;
  timestamp: number;
  nick: string;
  rating: string;
  comment: string;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const collyId = Number(id);
  if (!Number.isFinite(collyId)) return apiError("Invalid id", 400);

  const rows = await prisma.$queryRaw<CommentRow[]>(
    Prisma.sql`SELECT c.commentid, c.timestamp,
               COALESCE(c.nick, u.nick, 'unknown') AS nick,
               IFNULL(c.rating, '') AS rating, c.comment
               FROM comments c
               LEFT JOIN users u ON u.id = c.user_id
               WHERE c.colly_id = ${collyId}`
  );

  const comments = rows.map((row) => ({
    id: Number(row.commentid),
    time: new Date(row.timestamp * 1000).toISOString().slice(0, 16).replace("T", " "),
    nick: row.nick,
    rating: row.rating,
    comment: row.comment,
  }));

  return apiOk(comments);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { id } = await params;
  const collyId = Number(id);
  if (!Number.isFinite(collyId)) return apiError("Invalid id", 400);

  const rawBody = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(rawBody);
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);

  const comment = parsed.data.comment;
  const rating = parsed.data.rating ?? null;
  const userId = session.user.id;
  const nick = session.user.name ?? "";
  const timestamp = Math.floor(Date.now() / 1000);

  if (rating !== null) {
    await prisma.$executeRaw(
      Prisma.sql`UPDATE comments SET rating = NULL WHERE colly_id = ${collyId} AND user_id = ${userId}`
    );
  }

  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO comments
      (colly_id, filename, crew, artist, comment, rating, nick, timestamp, user_id)
      VALUES (
        ${collyId},
        (SELECT filename FROM collys WHERE id = ${collyId}),
        (SELECT GROUP_CONCAT(w.name) FROM collys_crews cc LEFT JOIN crews w ON w.id = cc.crew_id WHERE cc.colly_id = ${collyId} GROUP BY cc.colly_id),
        (SELECT GROUP_CONCAT(a.nick) FROM artists_collys ac LEFT JOIN artists a ON a.id = ac.artist_id WHERE ac.colly_id = ${collyId} GROUP BY ac.colly_id),
        ${comment},
        ${rating},
        ${nick},
        ${timestamp},
        ${userId}
      )`
  );

  await prisma.$executeRaw(
    Prisma.sql`UPDATE collys
               SET rating = (
                 SELECT (COUNT(rating) / (COUNT(rating) + 5.0)) * AVG(rating)
                      + (5.0 / (COUNT(rating) + 5.0)) * (SELECT AVG(rating) FROM comments WHERE rating > 0)
                 FROM comments WHERE colly_id = ${collyId} AND rating > 0
               )
               WHERE id = ${collyId}`
  );

  // Recalculate ratings for artists linked to this colly (Bayesian average, min 3 votes)
  await prisma.$executeRaw(
    Prisma.sql`UPDATE artists a
               INNER JOIN artists_collys ac ON ac.artist_id = a.id
               SET a.rating = 0
               WHERE ac.colly_id = ${collyId}`
  );

  await prisma.$executeRaw(
    Prisma.sql`UPDATE artists a
               INNER JOIN artists_collys ac2 ON ac2.artist_id = a.id AND ac2.colly_id = ${collyId}
               INNER JOIN (
                 SELECT ac.artist_id,
                   COUNT(c.rating) AS v,
                   AVG(c.rating) AS R
                 FROM comments c
                 INNER JOIN artists_collys ac ON ac.colly_id = c.colly_id
                 WHERE c.rating > 0
                 GROUP BY ac.artist_id
                 HAVING COUNT(c.rating) >= 3
               ) sub ON sub.artist_id = a.id
               SET a.rating = (sub.v / (sub.v + 5.0)) * sub.R
                            + (5.0 / (sub.v + 5.0)) * (SELECT AVG(rating) FROM comments WHERE rating > 0)`
  );

  // Recalculate ratings for crews linked to this colly (Bayesian average, min 3 votes)
  await prisma.$executeRaw(
    Prisma.sql`UPDATE crews cr
               INNER JOIN collys_crews cc ON cc.crew_id = cr.id
               SET cr.rating = 0
               WHERE cc.colly_id = ${collyId}`
  );

  await prisma.$executeRaw(
    Prisma.sql`UPDATE crews cr
               INNER JOIN collys_crews cc2 ON cc2.crew_id = cr.id AND cc2.colly_id = ${collyId}
               INNER JOIN (
                 SELECT cc.crew_id,
                   COUNT(cm.rating) AS v,
                   AVG(cm.rating) AS R
                 FROM comments cm
                 INNER JOIN collys_crews cc ON cc.colly_id = cm.colly_id
                 WHERE cm.rating > 0
                 GROUP BY cc.crew_id
                 HAVING COUNT(cm.rating) >= 3
               ) sub ON sub.crew_id = cr.id
               SET cr.rating = (sub.v / (sub.v + 5.0)) * sub.R
                             + (5.0 / (sub.v + 5.0)) * (SELECT AVG(rating) FROM comments WHERE rating > 0)`
  );

  return apiOk({ status: true });
}
