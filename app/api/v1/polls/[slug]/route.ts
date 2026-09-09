import { NextRequest, NextResponse } from "next/server";
import { v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";
import { loadPollBySlug } from "@/lib/polls/load";

// GET /api/v1/polls/:slug — poll with options + aggregated results.
// Anonymous view: results are included only when the poll's own
// show_results rule allows it (always / after_close on a closed poll),
// exactly like the public poll page.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const rl = checkV1RateLimit(clientIp(request));
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, { status: 429 });
  }
  const { slug: raw } = await params;
  let slug = raw;
  try { slug = decodeURIComponent(raw); } catch { /* keep */ }
  if (!slug) return v1Error("Invalid slug", 400);

  try {
    const loaded = await loadPollBySlug(slug, null);
    if (!loaded || loaded.poll.status === "draft") return v1Error("Poll not found", 404);
    const { poll, results, canSeeResults } = loaded;
    return NextResponse.json(
      {
        data: {
          id: poll.id,
          slug: poll.slug,
          title: poll.title,
          body: poll.body,
          type: poll.type,
          status: poll.effective_status,
          featured: poll.featured,
          opens_at: poll.opens_at,
          closes_at: poll.closes_at,
          created_at: poll.created_at,
          options: poll.options
            .filter((o) => o.approved)
            .map((o) => ({ id: o.id, label: o.label })),
          results: canSeeResults ? results : null,
          results_hidden: !canSeeResults,
          html_url: `/polls/${poll.slug}`,
          api_url: `/api/v1/polls/${poll.slug}`,
        },
      },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load poll", 500);
  }
}
