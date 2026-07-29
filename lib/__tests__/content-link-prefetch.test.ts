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
 * components/layout/Navbar.tsx had already been given prefetch={false} on every
 * link for exactly this reason. The content links never were, and there was
 * nothing to stop the next listing page from repeating it.
 *
 * The rule now lives in components/ui/ContentLink.tsx, and this test enforces
 * it: no `<Link>` may point at a heavy content route. Reach for ContentLink
 * instead, or set prefetch={false} deliberately.
 *
 * The first version of this test only matched hrefs written as literals, and
 * that let the worst offenders through. This codebase's idiom for an entity
 * link is a precomputed `url` field -- `href={colly.url}`, `href={l.url}` --
 * built in lib/sceneGraph.ts and the /api routes, and every one of those
 * resolves to a content route. So /collys, /artists, /crews, /mags, /apps and
 * the scene-links section kept prefetching after the first pass, and a trace
 * of /artist/boheme still showed 24 prefetches of other artists' pages.
 *
 * Hence the second rule below: a `<Link>` whose href is an expression cannot be
 * checked statically, so it has to say what it wants. Use ContentLink, or write
 * prefetch explicitly and say why.
 */

const HEAVY_ROUTES = [
  "release",
  "artist",
  "crew",
  "member",
  "magazine",
  "application",
  "country",
  "logos",
  "collys",
  "bbs",
  "requests",
];

const SCAN_ROOTS = ["app", "components"];
const HEAVY_HREF = new RegExp(`href=\\{?["'\`]/(${HEAVY_ROUTES.join("|")})/`);

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

describe("content links never prefetch", () => {
  const files = SCAN_ROOTS.flatMap((root) =>
    tsxFilesUnder(path.join(process.cwd(), root)),
  );

  it("scans a plausible number of files", () => {
    // Guards the guard: a broken walk that finds nothing would make every
    // assertion below pass regardless of what the code does.
    expect(files.length).toBeGreaterThan(50);
  });

  it("has no <Link> pointing at a heavy content route", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const { tag, line } of openingLinkTags(source)) {
        if (!HEAVY_HREF.test(tag)) continue;
        if (tag.includes("prefetch")) continue;
        offenders.push(`${path.relative(process.cwd(), file)}:${line}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("has no <Link> with a computed href that stays silent about prefetch", () => {
    // `href={colly.url}` cannot be resolved by reading the file, and on this
    // codebase those are exactly the entity links that hurt. So the choice has
    // to be explicit: ContentLink, or a stated prefetch.
    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const { tag, line } of openingLinkTags(source)) {
        if (tag.includes("prefetch")) continue;
        const href = /href=\{([^}]*)\}/.exec(tag);
        if (!href) continue; // href="/literal" — covered by the test above
        if (/^\s*[`"']\//.test(href[1])) continue; // literal inside braces
        offenders.push(`${path.relative(process.cwd(), file)}:${line}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("routes those links through ContentLink, which switches prefetch off", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/ui/ContentLink.tsx"),
      "utf8",
    );
    expect(source).toMatch(/prefetch=\{false\}/);
  });
});
