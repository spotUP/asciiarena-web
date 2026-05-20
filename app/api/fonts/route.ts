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
      SELECT * FROM styles WHERE id = ${fontId} AND (user_ids = ${userId} OR status > 1)
    `;
  } else {
    rows = await prisma.$queryRaw<StyleRow[]>`
      SELECT * FROM styles WHERE (user_ids = ${userId} OR status > 1) ORDER BY name
    `;
  }

  const result = rows.map((r) => ({
    fontid: r.id,
    fontstatus: r.status,
    fontname: r.name,
    fontdata: r.style,
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
  };
  const { fontid, fontname, fontdata, fontstatus } = body;

  if (!fontname || !fontdata || fontstatus === undefined) {
    return apiError("fontname, fontdata and fontstatus are required", 400);
  }

  if (fontid) {
    await prisma.$executeRaw`
      UPDATE styles SET name = ${fontname}, status = ${fontstatus}
      WHERE id = ${fontid} AND user_ids = ${userId}
    `;
    await prisma.$executeRaw`
      UPDATE styles SET style = ${fontdata}
      WHERE id = ${fontid} AND (user_ids = ${userId} OR status = 3)
    `;
    return apiOk({ status: true });
  } else {
    await prisma.$executeRaw`
      INSERT INTO styles (name, style, user, user_ids, status)
      VALUES (${fontname}, ${fontdata}, ${userId}, ${userId}, ${fontstatus})
    `;
    return apiOk({ status: true }, 201);
  }
}
