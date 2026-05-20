import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk, notifyDiscord, REQUEST_WEBHOOK, REQ_SORT_COLS, safeSort } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

interface RequestRow {
  id: number;
  title: string | null;
  description: string | null;
  status: number | null;
  timestamp: number | null;
  nick: string | null;
  total_count: bigint | number;
}

function formatTimestamp(ts: number | null): string {
  if (ts == null) return "";
  const d = new Date(ts * 1000);
  const Y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const H = String(d.getHours()).padStart(2, "0");
  const i = String(d.getMinutes()).padStart(2, "0");
  return `${Y}-${m}-${day} ${H}:${i}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const pagesize = Math.max(1, Math.min(200, parseInt(searchParams.get("pagesize") ?? "20") || 20));
  const sortCol = safeSort(searchParams.get("sort") ?? "timestamp", REQ_SORT_COLS, "timestamp");
  const ascending = (searchParams.get("asc") ?? "") === "A";
  const filter = searchParams.get("filter") ?? "";
  const viewmode = parseInt(searchParams.get("viewmode") ?? "0") || 0;
  const offset = (page - 1) * pagesize;

  const orderDir = Prisma.raw(ascending ? "ASC" : "DESC");
  const orderCol = Prisma.raw(sortCol);

  // Build viewmode status filter fragment
  let statusFilter: string;
  switch (viewmode) {
    case 0: statusFilter = "requests.status = 0"; break;
    case 1: statusFilter = "requests.status = 1"; break;
    case 2: statusFilter = "requests.status = 2"; break;
    case 3: statusFilter = "requests.status IN (1,2)"; break;
    default: statusFilter = "1=1"; break; // viewmode 4 = all
  }

  let rows: unknown[];
  let countRows: unknown[];

  if (filter) {
    const like = `%${filter}%`;
    rows = await prisma.$queryRaw`
      SELECT requests.*, users.nick AS user,
             COUNT(*) OVER() AS total_count
      FROM requests
      LEFT JOIN users ON users.id = requests.requestedby
      WHERE (${Prisma.raw(statusFilter)})
        AND (requests.title LIKE ${like} OR requests.description LIKE ${like} OR users.nick LIKE ${like})
      ORDER BY ${orderCol} ${orderDir}
      LIMIT ${Prisma.raw(String(pagesize))} OFFSET ${Prisma.raw(String(offset))}
    `;
    countRows = [];
  } else {
    rows = await prisma.$queryRaw`
      SELECT requests.*, users.nick AS user,
             COUNT(*) OVER() AS total_count
      FROM requests
      LEFT JOIN users ON users.id = requests.requestedby
      WHERE ${Prisma.raw(statusFilter)}
      ORDER BY ${orderCol} ${orderDir}
      LIMIT ${Prisma.raw(String(pagesize))} OFFSET ${Prisma.raw(String(offset))}
    `;
    countRows = [];
  }

  const result = (rows as RequestRow[]).map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    time: formatTimestamp(r.timestamp),
    user: r.nick,
    url: `info_requests.php?id=${r.id}`,
    total_count: Number(r.total_count),
  }));

  return apiOk(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await request.json() as { title?: string; description?: string };
  const { title, description } = body;

  if (!title || !description) {
    return apiError("title and description are required", 400);
  }

  const userId = parseInt(session.user.id);

  await prisma.$executeRaw`
    INSERT INTO requests (title, description, requestedby, timestamp)
    VALUES (${title}, ${description}, ${userId}, UNIX_TIMESTAMP())
  `;

  const nick = session.user.name ?? String(userId);
  await notifyDiscord(
    REQUEST_WEBHOOK,
    `New request by **${nick}**: ${title}\n${description}`
  );

  return apiOk({ status: true }, 201);
}
