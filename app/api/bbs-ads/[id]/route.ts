import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/utils";

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

  const rows = await prisma.$queryRaw<
    {
      id: number;
      bbs_id: number;
      bbs_name: string | null;
      filename: string | null;
      filesize: number | null;
      content: string | null;
      encoding: string | null;
      is_ansi: number | boolean | null;
      phones_json: string | null;
      nodes: number | null;
      handles_json: string | null;
      groups_json: string | null;
      page_url: string | null;
    }[]
  >`
    SELECT a.id, a.bbs_id, b.name AS bbs_name, a.filename, a.filesize,
           a.content, a.encoding, a.is_ansi, a.phones_json, a.nodes,
           a.handles_json, a.groups_json, a.page_url
    FROM bbs_ads a JOIN bbses b ON b.id = a.bbs_id
    WHERE a.id = ${id}
  `;
  const row = rows[0];
  if (!row) return apiError("Not found", 404);

  const parse = (s: string | null): string[] => {
    try {
      const v: unknown = JSON.parse(s ?? "[]");
      return Array.isArray(v) ? v.map(String) : [];
    } catch {
      return [];
    }
  };

  return NextResponse.json({
    id: Number(row.id),
    bbs_id: Number(row.bbs_id),
    bbs_name: row.bbs_name,
    filename: row.filename,
    filesize: row.filesize == null ? null : Number(row.filesize),
    content: row.content ?? "",
    encoding: row.encoding,
    is_ansi: row.is_ansi ? 1 : 0,
    phones: parse(row.phones_json),
    nodes: row.nodes == null ? null : Number(row.nodes),
    handles: parse(row.handles_json),
    groups: parse(row.groups_json),
    page_url: row.page_url,
  });
}
