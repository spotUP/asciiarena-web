import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";
import { AD_COLUMNS, parseJsonList, type AdRow } from "@/lib/bbsAdQueries";

// Members-only like the list route. Phones arrive pre-masked from the
// import (doorserver masks country+area on, subscriber off); the raw text
// is served as stored and MUST be rendered escaped (<pre>, never HTML).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const id = Number((await params).id);
  if (!Number.isFinite(id) || id <= 0) return apiError("Not found", 404);

  const rows = await prisma.$queryRaw<AdRow[]>`
    SELECT ${Prisma.raw(AD_COLUMNS)}
    FROM bbs_ads a JOIN bbses b ON b.id = a.bbs_id
    WHERE a.id = ${id}
  `;
  const row = rows[0];
  if (!row) return apiError("Not found", 404);

  return NextResponse.json({
    id: Number(row.id),
    bbs_id: Number(row.bbs_id),
    bbs_name: row.bbs_name,
    filename: row.filename,
    filesize: row.filesize == null ? null : Number(row.filesize),
    content: row.content ?? "",
    encoding: row.encoding,
    is_ansi: row.is_ansi ? 1 : 0,
    phones: parseJsonList(row.phones),
    nodes: row.nodes == null ? null : Number(row.nodes),
    handles: parseJsonList(row.handles),
    groups: parseJsonList(row.groups),
    page_url: row.page_url,
  });
}
