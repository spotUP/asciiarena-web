import { describe, expect, it } from "vitest";

import { shouldRenderBodyText } from "@/lib/forum/rules";

/**
 * The bug: every forum post drawn in the editor appeared twice -- once rendered
 * in colour from the ANSI attachment, and again as raw text underneath.
 *
 * Both come from the same canvas. mount.ts getText() extracts the printable
 * characters into `body` so mentions and the fulltext index have something to
 * read, and PostItem rendered the art and the body unconditionally.
 */
describe("post body rendering", () => {
  it("does not repeat the art as raw text", () => {
    expect(shouldRenderBodyText({ body: "HELLO", ansiB64: "AAAA" })).toBe(false);
  });

  it("renders the body of a post with no art", () => {
    expect(shouldRenderBodyText({ body: "just words", ansiB64: null })).toBe(true);
  });

  it("renders nothing for an empty body", () => {
    expect(shouldRenderBodyText({ body: "", ansiB64: null })).toBe(false);
    expect(shouldRenderBodyText({ body: null, ansiB64: null })).toBe(false);
  });

  it("treats a whitespace-only body as empty", () => {
    // getText() pads with spaces for the blocks it cannot represent, so a
    // drawing with no typed characters yields whitespace, not "".
    expect(shouldRenderBodyText({ body: "   \n  ", ansiB64: null })).toBe(false);
  });
});
