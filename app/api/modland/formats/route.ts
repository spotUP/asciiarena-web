// Same-origin proxy for the Modland per-format module counts → public DEViLBOX
// API. Used to weight the music player's "random" by catalog size. See
// lib/modland.ts (getModlandFormats / chooseRandomFormat).
const UPSTREAM = "https://devilbox.uprough.net/api/modland/formats";

export async function GET() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(UPSTREAM, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (asciiarena music widget)", Accept: "application/json" },
    });
    if (!r.ok) return Response.json({ error: "Formats failed", formats: [] }, { status: 502 });
    return Response.json(await r.json());
  } catch {
    return Response.json({ error: "Formats unavailable", formats: [] }, { status: 504 });
  } finally {
    clearTimeout(timer);
  }
}
