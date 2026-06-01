import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

interface CountRow { cnt: bigint | number }

// Tiny endpoint backing the ModerationBadge in the navbar. Only counts
// broken collys awaiting review. Open requests are a normal part of the
// site flow, not something an admin needs to triage.
export async function GET() {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") {
    return NextResponse.json({ broken: 0, total: 0 }, { status: 403 });
  }
  try {
    const [brokenRow] = await Promise.all([
      prisma.$queryRaw<CountRow[]>`SELECT COUNT(*) AS cnt FROM collys WHERE broken = 1`,
    ]);
    const broken = Number(brokenRow[0]?.cnt ?? 0);
    return NextResponse.json({ broken, total: broken });
  } catch {
    return NextResponse.json({ broken: 0, total: 0 });
  }
}
