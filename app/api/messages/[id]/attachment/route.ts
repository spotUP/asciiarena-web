import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

interface AttachmentRow {
  attach_filename: string | null;
  attach_filedata: string | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { id } = await params;
  const messageId = parseInt(id);
  const userId = parseInt(session.user.id);

  const rows = await prisma.$queryRaw<AttachmentRow[]>`
    SELECT attach_filename, attach_filedata FROM messages
    WHERE id = ${messageId} AND (from_id = ${userId} OR to_id = ${userId})
  `;

  const row = rows[0];
  if (!row) return apiError("Not found", 404);

  return apiOk({
    filename: row.attach_filename,
    filedata: row.attach_filedata,
  });
}
