import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// Regression: the tagging panel mounted CollyPreview without `artistOptions`,
// which defaults to []. The author picker therefore matched nothing and could
// only ever offer "create a new artist" -- so a tagger crediting an artist who
// is already in the catalog silently creates a duplicate of them.
//
// The admin editor never had this problem because it passes the list
// (app/admin/collys/CollysClient.tsx), and the submit form gets it from a
// server component. The panel is mounted client-side and needs the endpoint.

const panel = readFileSync(
  path.join(process.cwd(), "components/release/LogoTagPanel.tsx"),
  "utf8",
);

describe("logo tag panel author picker", () => {
  it("passes artist options through to the caption editor", () => {
    expect(panel).toMatch(/artistOptions=\{artistNames\}/);
  });

  it("sources the handles from the public names endpoint", () => {
    expect(panel).toMatch(/fetch\("\/api\/artists\/names"\)/);
  });

  it("does not let a failed name lookup block tagging", () => {
    // The tag-load failure is deliberately fail-closed because seeding from the
    // wrong source destroys maps. Losing autocomplete cannot destroy anything,
    // so it must degrade instead of blocking.
    const namesEffect = panel.slice(
      panel.indexOf('fetch("/api/artists/names")'),
      panel.indexOf("setFailed(null)"),
    );
    expect(namesEffect).toMatch(/\.catch\(/);
    expect(namesEffect).not.toMatch(/setFailed/);
  });
});

describe("artist names endpoint", () => {
  const route = readFileSync(
    path.join(process.cwd(), "app/api/artists/names/route.ts"),
    "utf8",
  );

  it("requires a session, matching the rest of the tagging surface", () => {
    expect(route).toMatch(/if \(!session\?\.user\?\.id\) return apiError\("Unauthorized", 401\)/);
  });

  it("returns handles only, leaking nothing the artist listing does not", () => {
    // Check the query itself, not the whole file, so prose in the comments
    // cannot fail or falsely pass this.
    const query = route.slice(route.indexOf("findMany("), route.indexOf("});", route.indexOf("findMany(")));
    expect(query).toMatch(/select: \{ nick: true \}/);
    expect(query).not.toMatch(/user_id|rating|country|www|acronym/);
  });

  it("is cached, since every tagger opening the panel asks for it", () => {
    expect(route).toMatch(/unstable_cache/);
    expect(route).toMatch(/revalidate:/);
  });
});
