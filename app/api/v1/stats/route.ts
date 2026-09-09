import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";

// GET /api/v1/stats — site totals for bots ("how big is the archive?").
export async function GET(request: NextRequest): Promise<NextResponse> {
  const rl = checkV1RateLimit(clientIp(request));
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, { status: 429 });
  }
  try {
    const [collys, logos, manualLogos, siteLogos, artists, crews, mags, apps, bbs, comments] = await Promise.all([
      prisma.collys.count(),
      prisma.colly_logos.count(),
      prisma.colly_logos.count({ where: { manual: 1 } }),
      prisma.logos.count(),
      prisma.artists.count(),
      prisma.crews.count(),
      prisma.mags.count(),
      prisma.apps.count(),
      prisma.bbses.count(),
      prisma.comments.count(),
    ]);
    return NextResponse.json(
      {
        data: {
          collys,
          tagged_logos: logos,
          manual_logos: manualLogos,
          auto_logos: logos - manualLogos,
          site_logos: siteLogos,
          artists,
          crews,
          mags,
          apps,
          bbses: bbs,
          comments,
        },
      },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load stats", 500);
  }
}
