// Same-origin proxy for Modland module downloads → public DEViLBOX API (which
// caches + rate-limits against ftp.modland.com). Returns raw module bytes.
const UPSTREAM = "https://devilbox.uprough.net/api/modland/download";

export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get("path");
  if (!path) return Response.json({ error: "Missing path" }, { status: 400 });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(`${UPSTREAM}?path=${encodeURIComponent(path)}`, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (asciiarena music widget)" },
    });
    if (!r.ok) {
      return Response.json({ error: "Download failed" }, { status: r.status === 429 ? 429 : 502 });
    }
    const buf = await r.arrayBuffer();
    return new Response(buf, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(buf.byteLength),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return Response.json({ error: "Download unavailable" }, { status: 504 });
  } finally {
    clearTimeout(timer);
  }
}
