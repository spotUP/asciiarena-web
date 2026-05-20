import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const body = await request.json() as { id: number; name?: string; author?: string; year?: number | null; month?: number | null; day?: number | null };
  if (!body.id) return apiError("id required", 400);

  await prisma.$executeRaw`
    UPDATE apps SET
      name = COALESCE(${body.name ?? null}, name),
      author = COALESCE(${body.author ?? null}, author),
      year = COALESCE(${body.year ?? null}, year),
      month = COALESCE(${body.month ?? null}, month),
      day = COALESCE(${body.day ?? null}, day)
    WHERE id = ${body.id}
  `;
  return apiOk({ status: true });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const body = await request.json() as { id: number };
  if (!body.id) return apiError("id required", 400);

  await prisma.$executeRaw`DELETE FROM apps WHERE id = ${body.id}`;
  return apiOk({ status: true });
}
