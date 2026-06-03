import { describe, it, expect } from "vitest";
import { decodePlaylistData } from "@/lib/playlistData";

describe("decodePlaylistData", () => {
  // A real HippoPlayer playlist file begins with the "HiPPrg" header. If the
  // bytes are decoded correctly the file is valid; HippoPlayer reports
  // "not a playlist" whenever it receives anything that doesn't start with it.
  it("decodes a data-URL payload back to the original HiPPrg file bytes", () => {
    const original = "HiPPrg\n\nhttp://example.com/tune.sid\n";
    const dataUrl =
      "data:application/octet-stream;base64," + Buffer.from(original, "latin1").toString("base64");
    expect(decodePlaylistData(dataUrl).toString("latin1")).toBe(original);
  });

  it("handles base64 payloads stored without the data: prefix", () => {
    const original = "HiPPrg\n";
    const bare = Buffer.from(original, "latin1").toString("base64");
    expect(decodePlaylistData(bare).toString("latin1")).toBe(original);
  });
});
