import { NextRequest } from "next/server";
import { fetchScenewall, isScenewallEndpoint } from "@/lib/scenewall";

// Thin HTTP wrapper around lib/scenewall.ts (server-side cached proxy for
// scenewall.bbs.io — see that file for the caching/timeout rationale).

export async function GET(request: NextRequest) {
  const endpoint = request.nextUrl.searchParams.get("endpoint");
  if (!isScenewallEndpoint(endpoint)) return new Response("invalid endpoint", { status: 400 });
  try {
    const data = await fetchScenewall(endpoint);
    return Response.json(data ?? null);
  } catch {
    // Upstream failed this round; clients retry (see lib/useScenewall.ts).
    return Response.json(null);
  }
}
