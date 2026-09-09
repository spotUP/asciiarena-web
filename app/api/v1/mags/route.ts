import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Params, parsePagination, parseQuery, v1Ok, v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";

interface MagRow {
  id: number;
  name: string | null;
  filename: string | null;
  author: string | null;
  filesize: number | null;
  year: number | null;
  month: number | null;
  day: number | null;
}

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
  const whereSql = q ? `WHERE name LIKE ? OR filename LIKE ? OR author LIKE ?` : "";
  const params: (string | number)[] = q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [];

  try {
    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<MagRow[]>(
        `SELECT id, name, filename, author, filesize, year, month, day FROM mags ${whereSql} ORDER BY year DESC, month DESC, day DESC LIMIT ${perPage} OFFSET ${offset}`,
        ...params,
      ),
      prisma.$queryRawUnsafe<{ cnt: bigint | number }[]>(
        `SELECT COUNT(*) AS cnt FROM mags ${whereSql}`,
        ...params,
      ),
    ]);
    const total = Number(countRows[0]?.cnt ?? 0);
    const data = rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      filename: r.filename,
      author: r.author,
      filesize: r.filesize != null ? Number(r.filesize) : null,
      year: r.year != null ? Number(r.year) : null,
      month: r.month != null ? Number(r.month) : null,
      day: r.day != null ? Number(r.day) : null,
      html_url: r.filename ? `/magazine/${r.filename}` : null,
    }));
    return v1Ok(data, page, perPage, total, v1RateHeaders(rl.remaining));
  } catch {
    return v1Error("Failed to list mags", 500);
  }
}
