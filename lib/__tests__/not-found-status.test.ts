import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Reported: missing content answered HTTP 200 instead of 404.
 *
 * A segment with a loading.tsx renders its page inside a Suspense boundary. As
 * soon as that fallback renders the response has begun -- status and headers
 * are on the wire -- so a notFound() thrown by the page can only swap in the
 * not-found UI, and Next serves it as 200 with a noindex tag.
 *
 * Measured on Next 16.2.6 with a throwaway app, one variant per placement:
 *
 *   loading.tsx + notFound() in page              -> 200
 *   loading.tsx + notFound() in generateMetadata  -> 200   (metadata streams too)
 *   loading.tsx + notFound() in layout            -> 404
 *   no loading.tsx + notFound() in page           -> 404
 *
 * Production before the fix: /member, /artist, /crew, /release, /forum/[board],
 * /forum/[board]/[topic], /requests/[id] and /bbs/[id] all answered 200, while
 * /polls, /country, /magazine and /application -- the sections with no
 * loading.tsx -- answered 404. Perfect correlation.
 *
 * So: a page that can 404 from inside a streaming boundary needs a layout above
 * it that runs the existence check first. This test holds that line for every
 * segment, including ones added later.
 */

const APP = path.join(__dirname, "..", "..", "app");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry === "page.tsx") out.push(full);
  }
  return out;
}

/** Segment directories from app/ down to the page, nearest last. */
function chain(pageFile: string): string[] {
  const dirs: string[] = [];
  let dir = path.dirname(pageFile);
  while (dir.startsWith(APP)) {
    dirs.unshift(dir);
    if (dir === APP) break;
    dir = path.dirname(dir);
  }
  return dirs;
}

const pagesThatCan404 = walk(APP).filter(f => readFileSync(f, "utf8").includes("notFound()"));

describe("404 status under a streaming boundary", () => {
  it("finds the pages that can 404 (guards against the walk silently breaking)", () => {
    expect(pagesThatCan404.length).toBeGreaterThan(10);
  });

  it.each(pagesThatCan404.map(f => [path.relative(APP, f), f] as const))(
    "%s answers with a real status code",
    (_rel, pageFile) => {
      const dirs = chain(pageFile);
      const firstBoundary = dirs.findIndex(d => existsSync(path.join(d, "loading.tsx")));
      if (firstBoundary === -1) return; // no boundary above it: the page's own notFound() sets 404

      // The guard has to sit at or ABOVE the segment that owns the loading.tsx.
      // A layout in a deeper segment is itself inside the boundary and runs too
      // late -- that mistake passes a naive "is there a guard anywhere" check,
      // and measured 200 on /forum/[board] and /requests/[id] until the parent
      // loaders were scoped into (index) route groups.
      const guardIndex = dirs.findIndex(d => {
        const layout = path.join(d, "layout.tsx");
        return existsSync(layout) && readFileSync(layout, "utf8").includes("@/lib/routeGuards");
      });

      expect(
        guardIndex !== -1 && guardIndex <= firstBoundary,
        `${path.relative(APP, pageFile)} calls notFound() inside a loading.tsx boundary, so it serves 200. ` +
        `Add a layout.tsx calling a guard from lib/routeGuards.ts at or above ` +
        `${path.relative(APP, dirs[firstBoundary]) || "app"}/loading.tsx, ` +
        `or scope that loader into an (index) route group so it stops covering this segment.`,
      ).toBe(true);
    },
  );
});
