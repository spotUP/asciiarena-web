import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

const patchSchema = z.object({
  comment: z.string().min(1).max(5000),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { commentId } = await params;
  const commentIdNum = Number(commentId);

  const rawBody = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(rawBody);
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);
  const { comment } = parsed.data;

  const userId = parseInt(session.user.id);
  const isAdmin = session.user.rank === "Admin" ? 1 : 0;

  await prisma.$executeRaw(
    Prisma.sql`UPDATE comments
               SET comment = ${comment}
               WHERE (${isAdmin} = 1 OR user_id = ${userId})
                 AND commentid = ${commentIdNum}`
  );

  return apiOk({ status: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  if (session.user.rank !== "Admin") return apiError("Forbidden", 403);

  const { id, commentId } = await params;
  const collyId = Number(id);
  const commentIdNum = Number(commentId);

  await prisma.$executeRaw(
    Prisma.sql`DELETE FROM comments WHERE commentid = ${commentIdNum}`
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
                 SELECT ac.artist_id, COUNT(c.rating) AS v, AVG(c.rating) AS R
                 FROM comments c INNER JOIN artists_collys ac ON ac.colly_id = c.colly_id
                 WHERE c.rating > 0 GROUP BY ac.artist_id HAVING COUNT(c.rating) >= 3
               ) sub ON sub.artist_id = a.id
               SET a.rating = (sub.v / (sub.v + 5.0)) * sub.R
                            + (5.0 / (sub.v + 5.0)) * (SELECT AVG(rating) FROM comments WHERE rating > 0)`
  );

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
                 SELECT cc.crew_id, COUNT(cm.rating) AS v, AVG(cm.rating) AS R
                 FROM comments cm INNER JOIN collys_crews cc ON cc.colly_id = cm.colly_id
                 WHERE cm.rating > 0 GROUP BY cc.crew_id HAVING COUNT(cm.rating) >= 3
               ) sub ON sub.crew_id = cr.id
               SET cr.rating = (sub.v / (sub.v + 5.0)) * sub.R
                             + (5.0 / (sub.v + 5.0)) * (SELECT AVG(rating) FROM comments WHERE rating > 0)`
  );

  return apiOk({ status: true });
}
