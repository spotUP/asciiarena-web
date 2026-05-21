import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

const postSchema = z.object({
  comment: z.string().max(1000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { id } = await params;
  const collyId = Number(id);

  const rawBody = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(rawBody);
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);
  const comment = parsed.data.comment ?? "";

  await prisma.$executeRaw(
    Prisma.sql`UPDATE collys SET broken = 1, broken_comment = ${comment} WHERE id = ${collyId}`
  );

  return apiOk({ status: true });
}
