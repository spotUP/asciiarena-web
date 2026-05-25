import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const peerId = parseInt(request.nextUrl.searchParams.get("peerId") ?? "");
  if (!peerId || isNaN(peerId)) return apiError("peerId required", 400);

  const myId = parseInt(session.user.id);

  const rows = await prisma.$queryRaw<[{ thread: number }?]>`
    SELECT thread FROM messages
    WHERE (from_id = ${myId} AND to_id = ${peerId})
       OR (from_id = ${peerId} AND to_id = ${myId})
    ORDER BY id DESC LIMIT 1
  `;

  return apiOk({ threadId: rows[0]?.thread ?? null });
}
