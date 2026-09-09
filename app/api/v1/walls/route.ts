import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v1Params, parsePagination, v1Ok, v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";

// GET /api/v1/walls — wall boards with post counts. Latest tags via
// /api/v1/walls/:id (same newest-13 shape as the on-site wall widget).
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

  try {
    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<{ id: number; name: string; description: string; post_count: bigint }[]>(
        `SELECT w.id, w.name, w.description,
                (SELECT COUNT(*) FROM wallposts wp WHERE wp.wall_id = w.id) AS post_count
         FROM walls w ORDER BY w.id ASC LIMIT ${perPage} OFFSET ${offset}`,
      ),
      prisma.$queryRawUnsafe<{ cnt: bigint | number }[]>(`SELECT COUNT(*) AS cnt FROM walls`),
    ]);
    const total = Number(countRows[0]?.cnt ?? 0);
    const data = rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      description: r.description,
      post_count: Number(r.post_count),
      api_url: `/api/v1/walls/${Number(r.id)}`,
    }));
    return v1Ok(data, page, perPage, total, v1RateHeaders(rl.remaining));
  } catch {
    return v1Error("Failed to list walls", 500);
  }
}
