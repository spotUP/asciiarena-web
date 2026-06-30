import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { indexColly, loadEntityDicts } from "@/lib/collyLogoIndex";

export const dynamic = "force-dynamic";
export const maxDuration = 800;

// Admin tool: (re)build the colly_logos catalog from the collys on disk. Useful
// for the initial backfill and after tuning the matcher. Authorized by admin
// rank, or a REINDEX_SECRET token (so it can be triggered from the host shell).
// Supports ?offset=&limit= to process in chunks if a full run is too long.
async function authorized(req: NextRequest): Promise<boolean> {
  const token = req.nextUrl.searchParams.get("token");
  if (token && process.env.REINDEX_SECRET && token === process.env.REINDEX_SECRET) return true;
  const session = await auth();
  return session?.user?.rank === "Admin";
}

export async function POST(req: NextRequest) {
  if (!(await authorized(req))) return new Response("forbidden", { status: 403 });

  const sp = req.nextUrl.searchParams;
  const startOffset = Math.max(0, parseInt(sp.get("offset") ?? "0", 10) || 0);
  const limit = Math.max(0, parseInt(sp.get("limit") ?? "0", 10) || 0); // 0 = all

  const dicts = await loadEntityDicts();
  const BATCH = 200;
  let offset = startOffset;
  let collys = 0;
  let withLogos = 0;
  let logos = 0;
  let resolved = 0;

  for (;;) {
    const take = limit > 0 ? Math.min(BATCH, startOffset + limit - offset) : BATCH;
    if (take <= 0) break;
    const batch = await prisma.collys.findMany({
      select: { id: true, filename: true, type: true },
      orderBy: { id: "asc" },
      skip: offset,
      take,
    });
    if (!batch.length) break;
    for (const c of batch) {
      try {
        const r = await indexColly(c.id, c.filename, c.type, dicts);
        collys++;
        logos += r.logos;
        resolved += r.resolved;
        if (r.logos) withLogos++;
      } catch {
        /* skip a bad colly, keep going */
      }
    }
    offset += batch.length;
  }

  return Response.json({
    entities: { artists: dicts.artists.length, crews: dicts.crews.length, users: dicts.users.length },
    collys,
    withLogos,
    logos,
    resolved,
    nextOffset: offset,
  });
}
