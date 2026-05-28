import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

interface CountRow { cnt: bigint | number }

// Tiny endpoint backing the ModerationBadge in the navbar. Counts the two
// things that need an admin's attention: broken collys awaiting review,
// and submitted requests still in the open (pending triage) state.
export async function GET() {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") {
    return NextResponse.json({ broken: 0, pending: 0, total: 0 }, { status: 403 });
  }
  try {
    const [brokenRow, pendingRow] = await Promise.all([
      prisma.$queryRaw<CountRow[]>`SELECT COUNT(*) AS cnt FROM collys WHERE broken = 1`,
      prisma.$queryRaw<CountRow[]>`SELECT COUNT(*) AS cnt FROM requests WHERE status = 0`,
    ]);
    const broken = Number(brokenRow[0]?.cnt ?? 0);
    const pending = Number(pendingRow[0]?.cnt ?? 0);
    return NextResponse.json({ broken, pending, total: broken + pending });
  } catch {
    return NextResponse.json({ broken: 0, pending: 0, total: 0 });
  }
}
