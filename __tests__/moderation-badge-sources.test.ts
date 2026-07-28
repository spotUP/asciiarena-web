import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

/**
 * The admin badge blinks on any site:moderation broadcast and then shows the
 * number app/api/admin/moderation-count returns. A source that broadcasts on
 * that channel without being counted produces a badge nobody can clear, so
 * every broadcaster has to have a matching count.
 */
describe("the admin moderation badge can always be cleared", () => {
  const countRoute = read("app/api/admin/moderation-count/route.ts");

  it("counts the broken collys that the broken-colly flow broadcasts about", () => {
    expect(countRoute).toMatch(/FROM collys WHERE broken = 1/);
  });

  it("counts the forum reports that the report endpoint broadcasts about", () => {
    expect(read("app/api/forum/reports/route.ts")).toContain('broadcast("site:moderation"');
    expect(countRoute).toMatch(/FROM forum_reports WHERE resolved_at IS NULL/);
  });

  it("adds every source into the total the badge renders", () => {
    // A source counted but left out of `total` is just as invisible.
    expect(countRoute).toMatch(/total:\s*broken \+ forumReports/);
  });

  it("names every counted source in the badge tooltip", () => {
    const badge = read("components/admin/ModerationBadge.tsx");
    expect(badge).toContain("broken colly");
    expect(badge).toContain("forum report");
  });
});
