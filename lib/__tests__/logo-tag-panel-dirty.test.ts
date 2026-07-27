import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// The panel merges auto-detected bands into whatever map it seeded. So
// opening it on a hand-curated colly and clicking Save without touching
// anything would rewrite that colly's map with auto-detected guesses -- an
// idle click destroying a curated map. The admin editor already guards this
// with a `logosDirty` ref (app/admin/collys/CollysClient.tsx); the public
// panel mirrors it.

const source = readFileSync(
  path.join(process.cwd(), "components/release/LogoTagPanel.tsx"),
  "utf8",
);

describe("logo tag panel dirty guard", () => {
  it("tracks whether the reader actually edited the map", () => {
    expect(source).toMatch(/const logosDirty = useRef\(false\)/);
    // The map only ever reaches the preview through the wrapper that marks it
    // dirty -- a raw `setLogoMap` handed to CollyPreview would bypass the guard.
    expect(source).toMatch(/const editLogoMap = useCallback\(/);
    expect(source).toMatch(/logosDirty\.current = true;\s*\n\s*setLogoMap\(/);
    expect(source).toMatch(/setLogoMap=\{editLogoMap\}/);
    expect(source).not.toMatch(/setLogoMap=\{setLogoMap\}/);
  });

  it("does not count seeding as an edit", () => {
    // Seeding runs setLogoMap directly and then clears the flag, so a freshly
    // opened panel is clean even though its map was just populated.
    expect(source).toMatch(/logosDirty\.current = false/);
  });

  it("makes Save a no-op when nothing changed, and says so", () => {
    expect(source).toMatch(/if \(!logosDirty\.current\)/);
    expect(source).toMatch(/[Nn]othing changed/);
    // The guard must come before the request is built, not after.
    const guardAt = source.indexOf("if (!logosDirty.current)");
    const fetchAt = source.indexOf(`fetch(\`/api/collys/\${collyId}/logos\`, {`);
    expect(guardAt).toBeGreaterThan(-1);
    expect(fetchAt).toBeGreaterThan(guardAt);
  });

  it("marks the map clean again after a successful save", () => {
    // Otherwise a second idle click would resend the identical map.
    expect(source.match(/logosDirty\.current = false/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
});
