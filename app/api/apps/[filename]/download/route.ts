import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const safe = filename.replace(/\.\./g, "").replace(/[/\\]/g, "");

  const rows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM apps WHERE filename = ${safe} LIMIT 1
  `;
  if (!rows[0]) return apiError("Not found", 404);

  await prisma.$executeRaw`UPDATE apps SET downloads = downloads + 1 WHERE id = ${rows[0].id}`;
  return apiOk({ status: true });
}
