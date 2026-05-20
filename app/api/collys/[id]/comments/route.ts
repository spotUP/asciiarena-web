import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

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

  const rows = await prisma.$queryRaw<CommentRow[]>(
    Prisma.sql`SELECT commentid, timestamp, nick, IFNULL(rating, '') AS rating, comment
               FROM comments
               WHERE colly_id = ${collyId}`
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

  const body = (await req.json()) as {
    colly_id?: number;
    comment: string;
    rating?: number;
  };

  const comment = body.comment;
  const rating = body.rating ?? null;
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
               SET rating = (SELECT AVG(rating) FROM comments WHERE colly_id = ${collyId} AND rating > 0)
               WHERE id = ${collyId}`
  );

  // Recalculate ratings
  await prisma.$executeRaw(
    Prisma.sql`UPDATE artists a SET a.rating = 0`
  );

  await prisma.$executeRaw(
    Prisma.sql`UPDATE artists a
               INNER JOIN (
                 SELECT ac.artist_id, AVG(c.rating) AS avgrating
                 FROM comments c
                 INNER JOIN artists_collys ac ON ac.colly_id = c.colly_id
                 WHERE c.rating > 0
                 GROUP BY ac.artist_id
               ) sub ON sub.artist_id = a.id
               SET a.rating = sub.avgrating`
  );

  await prisma.$executeRaw(
    Prisma.sql`UPDATE crews c SET c.rating = 0`
  );

  await prisma.$executeRaw(
    Prisma.sql`UPDATE crews c
               INNER JOIN (
                 SELECT cc.crew_id, AVG(cm.rating) AS avgrating
                 FROM comments cm
                 INNER JOIN collys_crews cc ON cc.colly_id = cm.colly_id
                 WHERE cm.rating > 0
                 GROUP BY cc.crew_id
               ) sub ON sub.crew_id = c.id
               SET c.rating = sub.avgrating`
  );

  return apiOk({ status: true });
}
