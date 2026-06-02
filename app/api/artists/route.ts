import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk, urlsafe, safeSort, ARTIST_SORT_COLS } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";
import { broadcast } from "@/lib/live";
import { ensureCrewId } from "@/lib/ensureEntity";

interface ArtistRow {
  id: number;
  nick: string;
  crews: string | null;
  rating: number | null;
  country: string | null;
}

interface CountRow {
  cnt: bigint | number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const pagesizeRaw = parseInt(searchParams.get("pagesize") ?? "25") || 25;
  const pagesize = Math.min(Math.max(1, pagesizeRaw), 200);
  const sortCol = safeSort(searchParams.get("sort") ?? "nick", ARTIST_SORT_COLS, "nick");
  const ascending = (searchParams.get("asc") ?? "") === "A";
  const filter = searchParams.get("filter") ?? "";

  const startInt = Math.max(0, (page - 1) * pagesize);
  const pagesizeInt = pagesize;

  const orderDir = Prisma.raw(ascending ? "ASC" : "DESC");
  const orderCol = Prisma.raw(sortCol);

  const likeParam = filter ? `%${filter}%` : null;

  let rows: ArtistRow[];
  let total_count: number;

  if (!likeParam) {
    // No filter: fast direct count + correlated subquery only for visible page rows
    const [dataRows, [countRow]] = await Promise.all([
      prisma.$queryRaw<ArtistRow[]>`
        SELECT a.id, a.nick, a.rating, a.country,
          COALESCE((SELECT GROUP_CONCAT(m.crew ORDER BY m.crew SEPARATOR ',')
                    FROM member_of m WHERE m.nick = a.nick), '') AS crews
        FROM artists a
        ORDER BY ${orderCol} ${orderDir}
        LIMIT ${Prisma.raw(String(pagesizeInt))} OFFSET ${Prisma.raw(String(startInt))}
      `,
      prisma.$queryRaw<[{ cnt: bigint }]>`SELECT COUNT(*) AS cnt FROM artists`,
    ]);
    rows = dataRows;
    total_count = Number(countRow?.cnt ?? 0);
  } else {
    const like = likeParam;
    const [dataRows, countRows] = await Promise.all([
      prisma.$queryRaw<ArtistRow[]>`
        SELECT s.id, s.nick, s.crews, s.rating, s.country FROM (
          SELECT a.id, a.nick, a.rating, a.country,
            COALESCE(GROUP_CONCAT(m.crew ORDER BY m.crew SEPARATOR ','), '') AS crews
          FROM artists a LEFT JOIN member_of m ON a.nick = m.nick
          GROUP BY a.id, a.nick, a.rating, a.country
        ) s
        WHERE s.nick LIKE ${like} OR s.crews LIKE ${like}
        ORDER BY ${orderCol} ${orderDir}
        LIMIT ${Prisma.raw(String(pagesizeInt))} OFFSET ${Prisma.raw(String(startInt))}
      `,
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*) AS cnt FROM (
          SELECT a.id FROM artists a LEFT JOIN member_of m ON a.nick = m.nick
          GROUP BY a.id, a.nick
          HAVING a.nick LIKE ${like} OR GROUP_CONCAT(m.crew) LIKE ${like}
        ) sub
      `,
    ]);
    rows = dataRows;
    total_count = Number(countRows[0]?.cnt ?? 0);
  }

  const result = rows.map((row) => ({
    url: `/artist/${urlsafe(row.nick)}`,
    id: Number(row.id),
    nick: row.nick,
    crews: row.crews ?? "",
    rating: row.rating != null ? Number(row.rating) : null,
    country: row.country ?? "",
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

  const nick = String(body.nick ?? "").trim();
  const acronym = String(body.acronym ?? "").trim();
  const www = String(body.www ?? "").trim();
  const country = String(body.country ?? "").trim();
  const active = String(body.active ?? "").trim();
  const crewnames = Array.isArray(body.crewname)
    ? (body.crewname as unknown[]).map(String).filter(Boolean)
    : [];

  if (!nick) return apiError("nick is required", 400);

  // Uniqueness check
  const dupCheck = await prisma.$queryRaw<CountRow[]>(
    Prisma.sql`SELECT count(*) AS cnt FROM artists WHERE nick = ${nick}`
  );
  if (Number(dupCheck[0]?.cnt ?? 0) > 0) {
    return apiError("An artist with that nick already exists", 409);
  }

  const artisturl = urlsafe(nick);

  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO artists (nick, acronym, www, active, country, artisturl)
      VALUES (${nick}, ${acronym}, ${www}, ${active}, ${country}, ${artisturl})`
  );

  // member_of is keyed by crew name (not id) so we still INSERT by name,
  // but call ensureCrewId first so the named crew exists as a real row
  // when the listing pill fires and downstream lookups need it.
  for (const crewname of crewnames) {
    await ensureCrewId(crewname);
    await prisma.$executeRaw(
      Prisma.sql`INSERT INTO member_of (crew, nick)
        SELECT ${crewname}, ${nick}
        WHERE (SELECT count(*) FROM member_of WHERE crew = ${crewname} AND nick = ${nick}) = 0`
    );
  }

  broadcast("site:artists", { type: "added", nick });
  return apiOk({ status: true }, 201);
}
