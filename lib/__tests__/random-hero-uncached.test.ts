import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// Regression, twice over: RANDOM RELEASES showed the same collys on every
// refresh because the ORDER BY RAND() result sat inside unstable_cache. A
// cached random pick is not random — and neither is a cached pool of
// candidates drawn from per request, which only widens the repeat cycle.
// The random hero must reach the database on every render.

const source = readFileSync(
  path.join(process.cwd(), "components/widgets/home/LatestReleasesStatic.tsx"),
  "utf8",
);

/** The argument list of every `unstable_cache(...)` call in the file. */
function cachedCallBodies(text: string): string[] {
  const bodies: string[] = [];
  let from = 0;
  for (;;) {
    const start = text.indexOf("unstable_cache(", from);
    if (start === -1) return bodies;
    let depth = 0;
    let i = start + "unstable_cache".length;
    for (; i < text.length; i++) {
      if (text[i] === "(") depth++;
      else if (text[i] === ")") { depth--; if (depth === 0) break; }
    }
    bodies.push(text.slice(start, i + 1));
    from = i + 1;
  }
}

describe("RANDOM RELEASES hero", () => {
  it("never runs its query inside a cache", () => {
    for (const body of cachedCallBodies(source)) {
      // A cached hero may only ever build the deterministic LATEST variant.
      expect(body).not.toMatch(/buildHero\(\s*(true|random)\b/);
      expect(body).toMatch(/buildHero\(\s*false\b/);
    }
  });

  it("still caches the deterministic LATEST hero", () => {
    expect(cachedCallBodies(source)).toHaveLength(1);
  });

  it("builds the random hero directly in the render path", () => {
    expect(source).toMatch(/random\s*\n?\s*\?\s*await buildHero\(true,/);
  });
});
