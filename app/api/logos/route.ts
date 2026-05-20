import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const author = String(body.author ?? "").trim();
  const ascii = String(body.ascii ?? "");

  if (!ascii) return apiError("ascii is required", 400);

  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO logos (author, ascii) VALUES (${author}, ${ascii})`
  );

  return apiOk({ status: true }, 201);
}
