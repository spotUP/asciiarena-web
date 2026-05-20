import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { commentId } = await params;
  const commentIdNum = Number(commentId);

  const body = (await req.json()) as { comment: string };
  const { comment } = body;

  const nick = session.user.name ?? "";
  const isAdmin = session.user.rank === "Admin" ? 1 : 0;

  await prisma.$executeRaw(
    Prisma.sql`UPDATE comments
               SET comment = ${comment}
               WHERE (${isAdmin} = 1 OR nick = ${nick})
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
