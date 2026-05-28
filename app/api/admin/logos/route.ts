import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { revalidateTag } from "next/cache";

const postSchema = z.object({
  ascii: z.string().min(1),
});

const deleteSchema = z.object({
  id: z.number().int().positive(),
});


export async function GET() {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const rows = await prisma.$queryRaw<{ id: number; ascii: string }[]>`
    SELECT logo_id AS id, ascii FROM logos ORDER BY logo_id DESC LIMIT 100
  `;
  return apiOk(rows);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const rawPostBody = await request.json().catch(() => ({}));
  const postParsed = postSchema.safeParse(rawPostBody);
  if (!postParsed.success) return apiError("Invalid request: " + postParsed.error.issues[0]?.message, 400);
  if (!postParsed.data.ascii.trim()) return apiError("ascii content required", 400);

  await prisma.$executeRaw`INSERT INTO logos (ascii) VALUES (${postParsed.data.ascii})`;
  revalidateTag("site:logos", "default");
  return apiOk({ status: true }, 201);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const rawDeleteBody = await request.json().catch(() => ({}));
  const deleteParsed = deleteSchema.safeParse(rawDeleteBody);
  if (!deleteParsed.success) return apiError("Invalid request: " + deleteParsed.error.issues[0]?.message, 400);

  await prisma.$executeRaw`DELETE FROM logos WHERE logo_id = ${deleteParsed.data.id}`;
  revalidateTag("site:logos", "default");
  return apiOk({ status: true });
}
