import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

const patchSchema = z.object({
  comment: z.string().min(1).max(5000),
});

interface AttachmentRow {
  attach_filename: string | null;
  attach_filedata: string | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { commentId } = await params;
  const commentIdInt = parseInt(commentId);

  const rows = await prisma.$queryRaw<AttachmentRow[]>`
    SELECT attach_filename, attach_filedata
    FROM request_comments
    WHERE comment_id = ${commentIdInt}
  `;

  const row = rows[0];
  if (!row) return apiError("Not found", 404);

  return apiOk({
    filename: row.attach_filename,
    filedata: row.attach_filedata,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { commentId } = await params;
  const commentIdInt = parseInt(commentId);
  const userId = parseInt(session.user.id);
  const isAdmin = (session.user as { rank?: string | null }).rank === "Admin" ? 1 : 0;

  const rawBody = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(rawBody);
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);
  const { comment } = parsed.data;

  await prisma.$executeRaw`
    UPDATE request_comments
    SET comment = ${comment}
    WHERE (${isAdmin} = 1 OR user_id = ${userId})
      AND comment_id = ${commentIdInt}
  `;

  return apiOk({ status: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const isAdmin = (session.user as { rank?: string | null }).rank === "Admin";
  if (!isAdmin) return apiError("Forbidden", 403);

  const { id, commentId } = await params;
  const requestId = parseInt(id);
  const commentIdInt = parseInt(commentId);

  await prisma.$executeRaw`
    DELETE FROM request_comments
    WHERE comment_id = ${commentIdInt} AND request_id = ${requestId}
  `;

  return apiOk({ status: true });
}
