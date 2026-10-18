import { describe, it, expect } from "vitest";
import { proxyLegacyPlaylist, HIPPOPLAYER_ORIGIN } from "@/lib/playlistProxy";

// The old asciiarena.se playlist URLs must keep answering with exactly the
// bytes hippoplayer.se serves: HippoPlayer 68k and UHC-Tools cannot change.
describe("proxyLegacyPlaylist", () => {
  const latin1 = Buffer.from("Filename\tPath\tTitle\tAuthor\tGenre\nb.prg\tplaylist\tBj\xf6rn\ts\tChip\n", "latin1");

  it("returns hippoplayer.se's bytes, status and content headers unchanged", async () => {
    const seen: string[] = [];
    const fake = (async (url: string) => {
      seen.push(url);
      return new Response(new Uint8Array(latin1), {
        status: 200,
        headers: { "content-type": "text/plain; charset=ISO-8859-1", "x-other": "dropped" },
      });
    }) as unknown as typeof fetch;
    const r = await proxyLegacyPlaylist("/uhcplaylists.php?l=5", fake);
    expect(seen).toEqual([HIPPOPLAYER_ORIGIN + "/uhcplaylists.php?l=5"]);
    expect(r.status).toBe(200);
    expect(Buffer.from(await r.arrayBuffer()).equals(latin1)).toBe(true);
    expect(r.headers.get("content-type")).toBe("text/plain; charset=ISO-8859-1");
    expect(r.headers.get("content-length")).toBe(String(latin1.length));
    expect(r.headers.get("x-other")).toBeNull();
  });

  it("passes a 404 through", async () => {
    const fake = (async () => new Response("Not found", { status: 404 })) as unknown as typeof fetch;
    expect((await proxyLegacyPlaylist("/playlist/nope.prg", fake)).status).toBe(404);
  });

  it("answers 502 when hippoplayer.se cannot be reached", async () => {
    const fake = (async () => { throw new Error("ECONNREFUSED"); }) as unknown as typeof fetch;
    expect((await proxyLegacyPlaylist("/playlist/a.prg", fake)).status).toBe(502);
  });
});
