import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";


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

  const body = await request.json() as { ascii?: string };
  if (!body.ascii?.trim()) return apiError("ascii content required", 400);

  await prisma.$executeRaw`INSERT INTO logos (ascii) VALUES (${body.ascii})`;
  return apiOk({ status: true }, 201);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const body = await request.json() as { id: number };
  if (!body.id) return apiError("id required", 400);

  await prisma.$executeRaw`DELETE FROM logos WHERE id = ${body.id}`;
  return apiOk({ status: true });
}
