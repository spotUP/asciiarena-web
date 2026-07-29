import { describe, it, expect } from "vitest";
import { describeFetchFailure, SCENEWALL_TIMEOUT_MS } from "../scenewall";

/**
 * The prod journal was filling with scenewall timeouts, 27 lines each: Next
 * logs a failed revalidation by dumping the thrown object, and an aborted
 * fetch rejects with a DOMException, whose 25 enumerable constants
 * (INDEX_SIZE_ERR, DOMSTRING_SIZE_ERR, ...) all get printed. Real errors were
 * buried under it.
 *
 * The widgets themselves were never broken — the cached proxy answers in
 * 0.9-3.9s — so this is about keeping the log readable, plus giving a
 * measured-slow upstream enough headroom to actually answer.
 */

describe("describeFetchFailure", () => {
  it("describes a timeout without the DOMException constant dump", () => {
    const abort = new Error("This operation was aborted");
    abort.name = "AbortError";
    expect(describeFetchFailure(abort)).toBe("no response within 30s");
  });

  it("keeps the message of a real failure", () => {
    expect(describeFetchFailure(new Error("HTTP 503"))).toBe("HTTP 503");
  });

  it("survives a non-Error rejection", () => {
    expect(describeFetchFailure("socket hang up")).toBe("socket hang up");
  });

  it("allows the upstream more time than it was measured taking", () => {
    // scenewall.bbs.io measured ~15.2s on 2026-07-29. A cap at or near that
    // is what caused the timeouts in the first place.
    expect(SCENEWALL_TIMEOUT_MS).toBeGreaterThan(15200);
  });
});
