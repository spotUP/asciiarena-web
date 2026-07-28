import { describe, it, expect } from "vitest";
import { activeTabHref } from "@/lib/admin-nav";
import { TABS } from "@/components/admin/AdminNav";

// The real routes, not a copy: a copy would keep passing after someone adds a
// tab that breaks the rules.
const HREFS = TABS.map(t => t.href);

describe("which admin tab is highlighted", () => {
  it("highlights exactly one tab on a nested page", () => {
    const lit = HREFS.filter(h => h === activeTabHref("/admin/forum/reports", HREFS));
    expect(lit).toHaveLength(1);
  });

  it("highlights the reports tab, not its parent, on the reports page", () => {
    expect(activeTabHref("/admin/forum/reports", HREFS)).toBe("/admin/forum/reports");
  });

  it("still highlights the forum tab on a board page under it", () => {
    expect(activeTabHref("/admin/forum/12", HREFS)).toBe("/admin/forum");
    expect(activeTabHref("/admin/forum/new", HREFS)).toBe("/admin/forum");
  });

  it("highlights the forum tab on the forum page itself", () => {
    expect(activeTabHref("/admin/forum", HREFS)).toBe("/admin/forum");
  });

  it("does not light the dashboard on every admin page", () => {
    expect(activeTabHref("/admin/users", HREFS)).toBe("/admin/users");
    expect(activeTabHref("/admin", HREFS)).toBe("/admin");
  });

  it("does not treat a longer word as a nested route", () => {
    // /admin/forums is a different section from /admin/forum, and a bare
    // startsWith would confuse the two.
    expect(activeTabHref("/admin/forums", HREFS)).toBeNull();
    expect(activeTabHref("/admin/forum-settings", HREFS)).toBeNull();
  });

  it("lights nothing on a page that is not a tab", () => {
    expect(activeTabHref("/forum", HREFS)).toBeNull();
  });
});
