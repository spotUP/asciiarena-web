import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk, urlsafe, safeSort, CREW_SORT_COLS } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

interface CrewRow {
  id: number;
  name: string | null;
  acronym: string | null;
  members_cnt: bigint | number;
  releases_cnt: bigint | number;
  rating: number | null;
}

interface CountRow {
  cnt: bigint | number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const pagesizeRaw = parseInt(searchParams.get("pagesize") ?? "25") || 25;
  const pagesize = Math.min(Math.max(1, pagesizeRaw), 200);
  const sortCol = safeSort(searchParams.get("sort") ?? "name", CREW_SORT_COLS, "name");
  const ascending = (searchParams.get("asc") ?? "") === "A";
  const filter = searchParams.get("filter") ?? "";

  const startInt = Math.max(0, (page - 1) * pagesize);
  const pagesizeInt = pagesize;

  const orderDir = Prisma.raw(ascending ? "ASC" : "DESC");
  const orderCol = Prisma.raw(sortCol);

  const likeParam = filter ? `%${filter}%` : "%";

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<CrewRow[]>`
      SELECT
        c.*,
        (SELECT count(id) FROM collys_crews cc WHERE cc.crew_id = c.id) AS releases_cnt,
        (SELECT count(id) FROM member_of mo WHERE mo.crew = c.name) AS members_cnt
      FROM crews c
      WHERE name LIKE ${likeParam}
      ORDER BY ${orderCol} ${orderDir}
      LIMIT ${Prisma.raw(String(pagesizeInt))} OFFSET ${Prisma.raw(String(startInt))}
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS cnt FROM crews c WHERE name LIKE ${likeParam}
    `,
  ]);
  const total_count = Number(countRows[0]?.cnt ?? 0);

  const result = rows.map((row) => ({
    url: `/crew/${urlsafe(row.name ?? "")}`,
    id: Number(row.id),
    name: row.name,
    acronym: row.acronym,
    members_cnt: Number(row.members_cnt),
    releases_cnt: Number(row.releases_cnt),
    rating: row.rating,
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
  const acronym = String(body.acronym ?? "").trim();
  const contact = String(body.contact ?? "").trim();
  const www = String(body.www ?? "").trim();
  const active = String(body.active ?? "").trim();
  const bbsnames = Array.isArray(body.bbsname)
    ? (body.bbsname as unknown[]).map(String).filter(Boolean)
    : [];

  if (!name) return apiError("name is required", 400);

  // Uniqueness check
  const dupCheck = await prisma.$queryRaw<CountRow[]>(
    Prisma.sql`SELECT count(*) AS cnt FROM crews WHERE name = ${name}`
  );
  if (Number(dupCheck[0]?.cnt ?? 0) > 0) {
    return apiError("A crew with that name already exists", 409);
  }

  const crewurl = urlsafe(name);

  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO crews (name, acronym, contact, crewurl, rating, www, active)
      VALUES (${name}, ${acronym}, ${contact}, ${crewurl}, NULL, ${www}, ${active})`
  );

  for (const bbsname of bbsnames) {
    await prisma.$executeRaw(
      Prisma.sql`INSERT INTO bbs_of (name, crew)
        SELECT ${bbsname}, ${name}
        WHERE (SELECT count(*) FROM bbs_of WHERE name = ${bbsname} AND crew = ${name}) = 0`
    );
  }

  return apiOk({ status: true }, 201);
}
