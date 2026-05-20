import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { id } = await params;
  const requestId = parseInt(id);
  const userId = parseInt(session.user.id);
  const isAdmin = (session.user as { rank?: string | null }).rank === "Admin" ? 1 : 0;

  const body = await request.json() as { status?: number };
  const { status } = body;

  if (status === undefined) return apiError("status is required", 400);

  await prisma.$executeRaw`
    UPDATE requests
    SET status = ${status}
    WHERE (${isAdmin} = 1 OR requestedby = ${userId})
      AND id = ${requestId}
  `;

  return apiOk({ status: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  if ((session.user as { rank?: string | null }).rank !== "Admin") return apiError("Forbidden", 403);

  const { id } = await params;
  const requestId = parseInt(id);

  await prisma.$executeRaw`DELETE FROM request_comments WHERE request_id = ${requestId}`;
  await prisma.$executeRaw`DELETE FROM requests WHERE id = ${requestId}`;

  return apiOk({ status: true });
}
