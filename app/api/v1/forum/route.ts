import { NextRequest, NextResponse } from "next/server";
import { v1Params, v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";
import { listRecentPosts } from "@/lib/forum/db";

// GET /api/v1/forum — newest forum posts across all publicly readable boards
// (same rows as the FORUM sidebar widget). Anonymous view, so private boards
// never leak — same visibility rules as the widget. Bodies are excerpted;
// follow html_url to read the thread.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const rl = checkV1RateLimit(clientIp(request));
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, { status: 429 });
  }
  const sp = v1Params(request);
  const limit = Math.min(Math.max(1, parseInt(sp.get("limit") ?? sp.get("per_page") ?? "10", 10) || 10), 25);

  try {
    const posts = await listRecentPosts({ userId: null, rank: null }, limit);
    return NextResponse.json(
      {
        data: posts.map((p) => ({
          id: p.id,
          topic: p.topicTitle,
          board: p.boardSlug,
          nick: p.authorNick,
          created_at: p.createdAt,
          excerpt: (p.body ?? "").slice(0, 300),
          html_url: `/forum/${p.boardSlug}/${p.topicSlug}#p${p.id}`,
        })),
      },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load forum posts", 500);
  }
}
