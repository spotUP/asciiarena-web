import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

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
    SELECT id, ascii FROM logos ORDER BY id DESC LIMIT 100
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
  return apiOk({ status: true }, 201);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const rawDeleteBody = await request.json().catch(() => ({}));
  const deleteParsed = deleteSchema.safeParse(rawDeleteBody);
  if (!deleteParsed.success) return apiError("Invalid request: " + deleteParsed.error.issues[0]?.message, 400);

  await prisma.$executeRaw`DELETE FROM logos WHERE id = ${deleteParsed.data.id}`;
  return apiOk({ status: true });
}
