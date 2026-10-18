// The shared HippoPlayer playlists moved to hippoplayer.se (its own database,
// its own admin in the hippoplayer.se PlaylistEditor). asciiarena.se keeps
// answering the old URLs that HippoPlayer 68k, UHC-Tools and older web
// players have built in, by passing each request through to hippoplayer.se
// and returning its bytes unchanged. A proxy, not a redirect: old Amiga HTTP
// stacks are not trusted to follow one more hop to another host.

export const HIPPOPLAYER_ORIGIN = process.env.HIPPOPLAYER_ORIGIN || "https://hippoplayer.se";

// Headers worth passing back. Hop-by-hop and encoding headers stay out: the
// body is re-sent as plain bytes, so Content-Length must match those bytes.
const PASS_HEADERS = ["content-type", "content-disposition", "cache-control"];

export async function proxyLegacyPlaylist(
  pathAndQuery: string,
  fetchImpl: typeof fetch = fetch
): Promise<Response> {
  let upstream: Response;
  try {
    upstream = await fetchImpl(HIPPOPLAYER_ORIGIN + pathAndQuery, { cache: "no-store", redirect: "follow" });
  } catch {
    return new Response("Bad gateway", { status: 502 });
  }
  const body = new Uint8Array(await upstream.arrayBuffer());
  const headers = new Headers();
  for (const h of PASS_HEADERS) {
    const v = upstream.headers.get(h);
    if (v !== null) headers.set(h, v);
  }
  headers.set("content-length", String(body.length));
  return new Response(body, { status: upstream.status, headers });
}
