// Same-origin proxy for Modland search → public DEViLBOX API. Keeps client
// fetches same-origin (COEP) and hides the upstream. See lib/modland.ts.
const UPSTREAM = "https://devilbox.uprough.net/api/modland/search";

export async function GET(req: Request) {
  const incoming = new URL(req.url).searchParams;
  const sp = new URLSearchParams();
  for (const k of ["q", "format", "author", "limit", "offset"]) {
    const v = incoming.get(k);
    if (v) sp.set(k, v);
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(`${UPSTREAM}?${sp}`, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (asciiarena music widget)", Accept: "application/json" },
    });
    if (!r.ok) return Response.json({ error: "Search failed", results: [] }, { status: 502 });
    return Response.json(await r.json());
  } catch {
    return Response.json({ error: "Search unavailable", results: [] }, { status: 504 });
  } finally {
    clearTimeout(timer);
  }
}
