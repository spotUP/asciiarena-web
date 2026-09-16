import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

interface AdRow {
  id: number;
  bbs_id: number;
  bbs_name: string | null;
  filename: string | null;
  filesize: number | null;
  is_ansi: number | boolean | null;
  nodes: number | null;
  total_count: number;
}

// BBS text ads are members-only: Demozoo hosts them login-walled, and this
// mirror respects the same boundary. Every route under /api/bbs-ads refuses
// anonymous callers - the pages redirect to /login, the API answers 401.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const pagesizeRaw = parseInt(searchParams.get("pagesize") ?? "25") || 25;
  const pagesize = Math.min(Math.max(1, pagesizeRaw), 200);
  const q = searchParams.get("q") ?? "";
  const bbsId = searchParams.get("bbs_id") ? Number(searchParams.get("bbs_id")) : null;
  const crew = searchParams.get("crew") ?? "";

  const startInt = Math.max(0, (page - 1) * pagesize);
  const likeParam = q ? `%${q}%` : "%";

  const bbsFilter = bbsId && Number.isFinite(bbsId) ? Prisma.sql`AND a.bbs_id = ${bbsId}` : Prisma.empty;
  const crewFilter = crew
    ? Prisma.sql`AND EXISTS (SELECT 1 FROM bbs_of bo WHERE bo.name = b.name AND bo.crew = ${crew})`
    : Prisma.empty;

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<AdRow[]>`
      SELECT a.id, a.bbs_id, b.name AS bbs_name, a.filename, a.filesize,
             a.is_ansi, a.nodes, COUNT(*) OVER () AS total_count
      FROM bbs_ads a JOIN bbses b ON b.id = a.bbs_id
      WHERE (a.filename LIKE ${likeParam} OR a.content LIKE ${likeParam})
      ${bbsFilter} ${crewFilter}
      ORDER BY a.id ASC
      LIMIT ${Prisma.raw(String(pagesize))} OFFSET ${Prisma.raw(String(startInt))}
    `,
    prisma.$queryRaw<{ cnt: bigint | number }[]>`
      SELECT COUNT(*) AS cnt
      FROM bbs_ads a JOIN bbses b ON b.id = a.bbs_id
      WHERE (a.filename LIKE ${likeParam} OR a.content LIKE ${likeParam})
      ${bbsFilter} ${crewFilter}
    `,
  ]);
  const total_count = Number(countRows[0]?.cnt ?? 0);

  return NextResponse.json(
    rows.map((row) => ({
      url: `/ads/${row.id}`,
      id: Number(row.id),
      bbs_id: Number(row.bbs_id),
      bbs_name: row.bbs_name,
      filename: row.filename,
      filesize: row.filesize == null ? null : Number(row.filesize),
      is_ansi: row.is_ansi ? 1 : 0,
      nodes: row.nodes == null ? null : Number(row.nodes),
      total_count,
    }))
  );
}
