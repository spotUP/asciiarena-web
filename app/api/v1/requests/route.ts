import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Params, parsePagination, parseQuery, v1Ok, v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";

interface RequestRow {
  id: number;
  title: string;
  description: string | null;
  status: number | null;
  timestamp: number | null;
  nick: string | null;
}

// status: 0 = open, 1 = filled, 2 = denied (matches /requests UI viewmode).
export async function GET(request: NextRequest): Promise<NextResponse> {
  const rl = checkV1RateLimit(clientIp(request));
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, {
      status: 429,
      headers: { "Retry-After": String(rl.resetAfter), ...v1RateHeaders(0) },
    });
  }
  const sp = v1Params(request);
  const { page, perPage, offset } = parsePagination(sp);
  const q = parseQuery(sp);
  const statusRaw = parseInt(sp.get("status") ?? "", 10);
  const status = Number.isFinite(statusRaw) && statusRaw >= 0 && statusRaw <= 2 ? statusRaw : null;

  const where: string[] = [];
  const params: (string | number)[] = [];
  if (q) { where.push(`(r.title LIKE ? OR r.description LIKE ?)`); params.push(`%${q}%`, `%${q}%`); }
  if (status !== null) { where.push(`r.status = ?`); params.push(status); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<RequestRow[]>(
        `SELECT r.id, r.title, r.description, r.status, r.timestamp, u.nick AS nick
         FROM requests r LEFT JOIN users u ON u.id = r.requestedby
         ${whereSql} ORDER BY r.timestamp DESC LIMIT ${perPage} OFFSET ${offset}`,
        ...params,
      ),
      prisma.$queryRawUnsafe<{ cnt: bigint | number }[]>(
        `SELECT COUNT(*) AS cnt FROM requests r ${whereSql}`,
        ...params,
      ),
    ]);
    const total = Number(countRows[0]?.cnt ?? 0);
    const data = rows.map((r) => ({
      id: Number(r.id),
      title: r.title,
      description: r.description,
      status: r.status != null ? Number(r.status) : 0,
      requested_by: r.nick,
      timestamp: r.timestamp != null ? Number(r.timestamp) : null,
      html_url: `/requests/${Number(r.id)}`,
      api_url: `/api/v1/requests/${Number(r.id)}`,
    }));
    return v1Ok(data, page, perPage, total, v1RateHeaders(rl.remaining));
  } catch {
    return v1Error("Failed to list requests", 500);
  }
}
