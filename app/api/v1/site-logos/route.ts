import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Params, parsePagination, parseQuery, v1Ok, v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";

interface SiteLogoRow {
  logo_id: number;
  author: string | null;
  kind: string;
  font: string | null;
  ascii: string;
}

// GET /api/v1/site-logos — the standalone logo wall (logos table), NOT the
// logos tagged inside collys (/api/v1/logos). List returns a text preview so
// payloads stay small; fetch one logo for the full ASCII/ANSI text.
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
  const author = (sp.get("author") ?? "").trim().slice(0, 60);
  const kindRaw = (sp.get("kind") ?? "").toLowerCase();
  const kind = kindRaw === "ascii" || kindRaw === "ansi" ? kindRaw : null;

  const where: string[] = [];
  const params: (string | number)[] = [];
  if (q) { where.push(`(author LIKE ? OR ascii LIKE ?)`); params.push(`%${q}%`, `%${q}%`); }
  if (author) { where.push(`author LIKE ?`); params.push(`%${author}%`); }
  if (kind) { where.push(`kind = ?`); params.push(kind); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<SiteLogoRow[]>(
        `SELECT logo_id, author, kind, font, ascii FROM logos ${whereSql} ORDER BY logo_id DESC LIMIT ${perPage} OFFSET ${offset}`,
        ...params,
      ),
      prisma.$queryRawUnsafe<{ cnt: bigint | number }[]>(
        `SELECT COUNT(*) AS cnt FROM logos ${whereSql}`,
        ...params,
      ),
    ]);
    const total = Number(countRows[0]?.cnt ?? 0);
    const data = rows.map((r) => {
      const id = Number(r.logo_id);
      const ascii = r.ascii ?? "";
      return {
        id,
        author: r.author,
        kind: r.kind,
        font: r.font,
        chars: ascii.length,
        preview: ascii.slice(0, 500),
        api_url: `/api/v1/site-logos/${id}`,
        html_url: `/logos`,
      };
    });
    return v1Ok(data, page, perPage, total, v1RateHeaders(rl.remaining));
  } catch {
    return v1Error("Failed to list site logos", 500);
  }
}
