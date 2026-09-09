import { NextRequest, NextResponse } from "next/server";
import { v1Params, v1Error } from "@/lib/api-v1";
import { checkV1RateLimit, clientIp, v1RateHeaders } from "@/lib/api-v1-rate-limit";
import { fetchScenewall, type ScenewallEndpoint } from "@/lib/scenewall";

// GET /api/v1/weektop — BBS weektop data proxied through the same cached
// fetcher as the sidebar widgets (5-minute TTL, serves last good value when
// the upstream is down, so bots never pay the ~15s upstream latency).
// ?source=uploaders (default) | bbs | globalwall.
const SOURCES: Record<string, ScenewallEndpoint> = {
  uploaders: "weektop",
  bbs: "bbs-weektop",
  globalwall: "globalwall",
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rl = checkV1RateLimit(clientIp(request));
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again soon." }, { status: 429 });
  }
  const sp = v1Params(request);
  const source = (sp.get("source") ?? "uploaders").toLowerCase();
  const endpoint = SOURCES[source];
  if (!endpoint) return v1Error("Invalid source (uploaders|bbs|globalwall)", 400);

  try {
    const data = await fetchScenewall(endpoint);
    return NextResponse.json(
      { data: { source, upstream: `scenewall:${endpoint}`, items: data ?? null } },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600", ...v1RateHeaders(rl.remaining) } },
    );
  } catch {
    return v1Error("Failed to load weektop", 500);
  }
}
