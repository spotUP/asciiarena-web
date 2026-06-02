import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk, safeSort, BBS_SORT_COLS } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";
import { broadcast } from "@/lib/live";

interface BbsRow {
  id: number;
  name: string | null;
  sysop: string | null;
  country: string | null;
  online: number | boolean | null;
}

interface CountRow {
  cnt: bigint | number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const pagesizeRaw = parseInt(searchParams.get("pagesize") ?? "25") || 25;
  const pagesize = Math.min(Math.max(1, pagesizeRaw), 200);
  const sortCol = safeSort(searchParams.get("sort") ?? "name", BBS_SORT_COLS, "name");
  const ascending = (searchParams.get("asc") ?? "") === "A";
  const filter = searchParams.get("filter") ?? "";

  const startInt = Math.max(0, (page - 1) * pagesize);
  const pagesizeInt = pagesize;

  const orderDir = Prisma.raw(ascending ? "ASC" : "DESC");
  const orderCol = Prisma.raw(sortCol);

  const likeParam = filter ? `%${filter}%` : "%";

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<BbsRow[]>`
      SELECT * FROM bbses
      WHERE name LIKE ${likeParam} OR sysop LIKE ${likeParam}
      ORDER BY ${orderCol} ${orderDir}
      LIMIT ${Prisma.raw(String(pagesizeInt))} OFFSET ${Prisma.raw(String(startInt))}
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS cnt FROM bbses
      WHERE name LIKE ${likeParam} OR sysop LIKE ${likeParam}
    `,
  ]);
  const total_count = Number(countRows[0]?.cnt ?? 0);

  const result = rows.map((row) => ({
    url: `/bbs/${row.id}`,
    id: Number(row.id),
    name: row.name,
    sysop: row.sysop,
    country: row.country ?? "",
    online: row.online ? 1 : 0,
    total_count,
  }));

  return NextResponse.json(result, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const name = String(body.name ?? "").trim();
  const address = String(body.address ?? "").trim();
  const sysop = String(body.sysop ?? "").trim();
  const number = String(body.number ?? "").trim();
  const country = String(body.country ?? "").trim();
  const software = String(body.software ?? "").trim();
  const online = body.online === true || body.online === "on" ? 1 : 0;

  if (!name) return apiError("name is required", 400);

  // Uniqueness check
  const dupCheck = await prisma.$queryRaw<CountRow[]>(
    Prisma.sql`SELECT count(*) AS cnt FROM bbses WHERE name = ${name}`
  );
  if (Number(dupCheck[0]?.cnt ?? 0) > 0) {
    return apiError("A BBS with that name already exists", 409);
  }

  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO bbses (name, address, sysop, number, country, online, software)
      VALUES (${name}, ${address}, ${sysop}, ${number}, ${country}, ${online}, ${software})`
  );

  broadcast("site:bbs", { type: "added", name });
  return apiOk({ status: true }, 201);
}
