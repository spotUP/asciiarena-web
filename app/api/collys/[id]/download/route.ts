import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { id } = await params;
  const collyId = Number(id);

  await prisma.$executeRaw(
    Prisma.sql`UPDATE collys SET downloads = downloads + 1 WHERE id = ${collyId}`
  );

  return apiOk({ status: true });
}
