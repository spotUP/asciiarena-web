import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Regression: the site got slow on link-dense pages, and the pages themselves
 * were not to blame.
 *
 * Next prefetches `<Link>` targets as they enter the viewport, and on this site
 * each of those prefetches is a FULL server render of the target. Measured on
 * prod: /release/* costs 0.5-1.3s and 120-190KB per prefetch, because those
 * pages decode and render ANSI art. /artist/boheme carries 150 release links,
 * so scrolling one artist page asked a two-CPU box for a hundred-plus renders
 * of pages nobody had navigated to. The page being viewed measured a healthy
 * 1.08s LCP the whole time -- the cost landed on everyone else.
 *
 * This rule took three attempts, and the first two were too clever:
 *
 *   1. Flag `<Link>`s whose href literally starts with a heavy route. Missed
 *      every `href={colly.url}` entity link -- which is this codebase's normal
 *      idiom, built in lib/sceneGraph.ts and the /api routes -- so /collys,
 *      /artists, /crews, /mags and /apps kept prefetching. A trace still showed
 *      24 prefetches of other artists' pages.
 *   2. Also require computed hrefs to declare intent, and grow the heavy-route
 *      list. Better, but the list needed /bbs and /requests added the moment it
 *      was looked at, which is a list that will always be one page out of date.
 *
 * So the rule is now total, and needs no list: every `<Link>` states its
 * prefetch, or is a ContentLink, which states it once for everybody. There is no
 * page on this site that is cheap to prefetch -- they are all database-backed
 * server renders -- so "off unless someone justifies it" is the honest default,
 * and it is what components/layout/Navbar.tsx had already been doing by hand.
 */

const SCAN_ROOTS = ["app", "components"];

function tsxFilesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...tsxFilesUnder(full));
    } else if (entry.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Blank out comments, preserving newlines so reported line numbers stay right.
 * Several files discuss `<Link>` in prose -- ContentLink's own doc comment does
 * -- and a scanner that cannot tell code from commentary reports those as
 * offenders.
 */
function stripComments(source: string): string {
  const blank = (m: string) => m.replace(/[^\n]/g, " ");
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + blank(m.slice(p1.length)));
}

/** Every `<Link ...>` opening tag in a file, with its 1-based line number. */
function openingLinkTags(source: string): { tag: string; line: number }[] {
  const tags: { tag: string; line: number }[] = [];
  const re = /<Link\b[\s\S]*?>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    tags.push({ tag: m[0], line: source.slice(0, m.index).split("\n").length });
  }
  return tags;
}

describe("links never prefetch unless asked to", () => {
  const files = SCAN_ROOTS.flatMap((root) =>
    tsxFilesUnder(path.join(process.cwd(), root)),
  );

  it("scans a plausible number of files", () => {
    // Guards the guard: a broken walk that finds nothing would make the
    // assertions below pass regardless of what the code does.
    expect(files.length).toBeGreaterThan(50);
  });

  it("finds the <Link> tags it is supposed to be checking", () => {
    // Likewise: if comment-stripping or the tag regex broke, the offender list
    // would be empty for the wrong reason.
    const total = files.reduce(
      (n, f) => n + openingLinkTags(stripComments(readFileSync(f, "utf8"))).length,
      0,
    );
    expect(total).toBeGreaterThan(80);
  });

  it("has no <Link> that leaves prefetch unstated", () => {
    // Fix by using ContentLink, or by writing prefetch explicitly and saying
    // why -- as app/admin/page.tsx and components/admin/AdminNav.tsx do for
    // admin navigation, which is not a content link.
    const offenders: string[] = [];
    for (const file of files) {
      const source = stripComments(readFileSync(file, "utf8"));
      for (const { tag, line } of openingLinkTags(source)) {
        if (tag.includes("prefetch")) continue;
        offenders.push(`${path.relative(process.cwd(), file)}:${line}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("routes links through ContentLink, which switches prefetch off", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/ui/ContentLink.tsx"),
      "utf8",
    );
    expect(source).toMatch(/prefetch=\{false\}/);
  });
});
