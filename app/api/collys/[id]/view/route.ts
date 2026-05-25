import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";
import { broadcast } from "@/lib/live";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { id } = await params;
  const collyId = Number(id);

  await prisma.$executeRaw(
    Prisma.sql`UPDATE collys SET view_counter = view_counter + 1 WHERE id = ${collyId}`
  );

  broadcast(`comments:${collyId}`, { type: "viewed" });

  return apiOk({ status: true });
}
