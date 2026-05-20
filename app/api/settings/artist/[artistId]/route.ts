import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ artistId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const userId = parseInt(session.user.id);
  const { artistId } = await params;
  const id = parseInt(artistId);

  const result = await prisma.$executeRaw`
    UPDATE artists SET user_id = NULL WHERE id = ${id} AND user_id = ${userId}
  `;

  if (result === 0) return apiError("Not found or not yours", 403);
  return apiOk({ status: true });
}
