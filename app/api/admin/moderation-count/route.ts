import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

interface CountRow { cnt: bigint | number }

// Tiny endpoint backing the ModerationBadge in the navbar. Counts the things an
// admin has to act on: broken collys awaiting review, and unresolved forum
// reports. Open requests are a normal part of the site flow, not triage.
//
// Every source that broadcasts site:moderation MUST be counted here. The badge
// blinks on the broadcast and then shows this number, so a source that
// broadcasts without being counted produces a badge nobody can ever clear.
// __tests__/moderation-badge-sources.test.ts guards the pairing.
export async function GET() {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") {
    return NextResponse.json({ broken: 0, forumReports: 0, total: 0 }, { status: 403 });
  }
  try {
    const [brokenRow, reportRow] = await Promise.all([
      prisma.$queryRaw<CountRow[]>`SELECT COUNT(*) AS cnt FROM collys WHERE broken = 1`,
      prisma.$queryRaw<CountRow[]>`SELECT COUNT(*) AS cnt FROM forum_reports WHERE resolved_at IS NULL`,
    ]);
    const broken = Number(brokenRow[0]?.cnt ?? 0);
    const forumReports = Number(reportRow[0]?.cnt ?? 0);
    return NextResponse.json({ broken, forumReports, total: broken + forumReports });
  } catch {
    return NextResponse.json({ broken: 0, forumReports: 0, total: 0 });
  }
}
