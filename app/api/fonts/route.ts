import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

interface StyleRow {
  id: number;
  name: string | null;
  style: string | null;
  status: number | null;
  user: number | null;
  user_ids: number | null;
  group_id: number | null;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const idParam = searchParams.get("id");
  const userId = parseInt(session.user.id);

  let rows: StyleRow[];

  if (idParam) {
    const fontId = parseInt(idParam);
    rows = await prisma.$queryRaw<StyleRow[]>`
      SELECT s.* FROM styles s
      WHERE s.id = ${fontId}
        AND (
          s.user_ids = ${userId}
          OR s.status > 1
          OR s.group_id IN (SELECT group_id FROM font_group_members WHERE user_id = ${userId})
        )
    `;
  } else {
    rows = await prisma.$queryRaw<StyleRow[]>`
      SELECT s.* FROM styles s
      WHERE s.user_ids = ${userId}
        OR s.status > 1
        OR s.group_id IN (SELECT group_id FROM font_group_members WHERE user_id = ${userId})
      ORDER BY s.name
    `;
  }

  const result = rows.map((r) => ({
    fontid: r.id,
    fontstatus: r.status,
    fontname: r.name,
    fontdata: r.style,
    group_id: r.group_id ?? null,
  }));

  return apiOk(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const userId = parseInt(session.user.id);
  const body = await request.json() as {
    fontid?: number;
    fontname?: string;
    fontdata?: string;
    fontstatus?: number;
    group_id?: number | null;
  };
  const { fontid, fontname, fontdata, fontstatus, group_id } = body;

  if (!fontname || !fontdata || fontstatus === undefined) {
    return apiError("fontname, fontdata and fontstatus are required", 400);
  }

  const groupId = group_id ?? null;

  if (fontid) {
    await prisma.$executeRaw`
      UPDATE styles SET name = ${fontname}, status = ${fontstatus}, group_id = ${groupId}
      WHERE id = ${fontid} AND user_ids = ${userId}
    `;
    await prisma.$executeRaw`
      UPDATE styles SET style = ${fontdata}
      WHERE id = ${fontid}
        AND (
          user_ids = ${userId}
          OR status = 3
          OR group_id IN (SELECT group_id FROM font_group_members WHERE user_id = ${userId})
        )
    `;
    return apiOk({ status: true });
  } else {
    // Return the new id so the editor can switch to UPDATE mode and auto-save
    // edits without creating a duplicate every time. INSERT + LAST_INSERT_ID()
    // must share one connection (it's connection-scoped), hence the transaction.
    const newFontId = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO styles (name, style, user, user_ids, status, group_id)
        VALUES (${fontname}, ${fontdata}, ${userId}, ${userId}, ${fontstatus}, ${groupId})
      `;
      const inserted = await tx.$queryRaw<[{ id: bigint | number }]>`SELECT LAST_INSERT_ID() AS id`;
      return Number(inserted[0]?.id ?? 0);
    });
    return apiOk({ status: true, fontid: newFontId }, 201);
  }
}
