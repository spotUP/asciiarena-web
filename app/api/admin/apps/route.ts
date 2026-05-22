import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

const patchSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().optional(),
  author: z.string().optional(),
  year: z.number().int().nullable().optional(),
  month: z.number().int().nullable().optional(),
  day: z.number().int().nullable().optional(),
});

const deleteSchema = z.object({
  id: z.number().int().positive(),
});

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const rawBody = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(rawBody);
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);
  const { id, name, author, year, month, day } = parsed.data;

  await prisma.$executeRaw`
    UPDATE apps SET
      name = COALESCE(${name ?? null}, name),
      author = COALESCE(${author ?? null}, author),
      year = COALESCE(${year ?? null}, year),
      month = COALESCE(${month ?? null}, month),
      day = COALESCE(${day ?? null}, day)
    WHERE id = ${id}
  `;
  return apiOk({ status: true });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const rawBody = await request.json().catch(() => ({}));
  const parsed = deleteSchema.safeParse(rawBody);
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);

  await prisma.$executeRaw`DELETE FROM apps WHERE id = ${parsed.data.id}`;
  return apiOk({ status: true });
}
