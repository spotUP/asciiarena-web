import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Not logged in", 401);
  const userId = parseInt(session.user.id);

  const body = (await req.json().catch(() => ({}))) as {
    ids?: number[] | "all";
  };

  const now = Math.floor(Date.now() / 1000);

  if (body.ids === "all") {
    await prisma.notifications.updateMany({
      where: { user_id: userId, read_at: null },
      data: { read_at: now },
    });
  } else if (Array.isArray(body.ids) && body.ids.length > 0) {
    const cleanIds = body.ids.filter((n): n is number => typeof n === "number");
    await prisma.notifications.updateMany({
      where: { user_id: userId, id: { in: cleanIds }, read_at: null },
      data: { read_at: now },
    });
  } else {
    return apiError("Provide ids: number[] or 'all'", 400);
  }

  return NextResponse.json({ ok: true });
}
