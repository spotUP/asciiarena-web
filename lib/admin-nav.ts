/**
 * Which admin tab is the current one.
 *
 * Pure so the matching rules are testable without rendering the nav.
 *
 * Two rules, both learned from real breakage:
 *
 *  - Most specific wins. A plain `startsWith` lights every ancestor, so
 *    /admin/forum/reports used to highlight both FORUM and FORUM REPORTS.
 *  - A prefix only counts on a segment boundary. `startsWith("/admin/forum")`
 *    also matches /admin/forums and /admin/forum-settings, which are different
 *    sections entirely.
 */
export function activeTabHref(pathname: string, hrefs: string[]): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    // The dashboard is the one exact-only tab: every admin route starts with
    // "/admin", so a prefix match there would light it permanently.
    const matches =
      href === "/admin"
        ? pathname === "/admin"
        : pathname === href || pathname.startsWith(`${href}/`);
    if (matches && (best === null || href.length > best.length)) best = href;
  }
  return best;
}
