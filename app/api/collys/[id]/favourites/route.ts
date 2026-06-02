import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

interface CollyFilenameRow {
  filename: string;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { id } = await params;
  const collyId = Number(id);
  const userId = parseInt(session.user.id, 10);
  const nick = session.user.name ?? "";

  const rows = await prisma.$queryRaw<CollyFilenameRow[]>(
    Prisma.sql`SELECT filename FROM collys WHERE id = ${collyId}`
  );

  const filename = rows[0]?.filename ?? "";

  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO favourites (user_id, colly_id, nick, filename)
               VALUES (${userId}, ${collyId}, ${nick}, ${filename})`
  );

  return apiOk({ status: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { id } = await params;
  const collyId = Number(id);
  const userId = session.user.id;

  await prisma.$executeRaw(
    Prisma.sql`DELETE FROM favourites WHERE user_id = ${userId} AND colly_id = ${collyId}`
  );

  return apiOk({ status: true });
}
