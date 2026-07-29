"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeTabHref } from "@/lib/admin-nav";

// Exported so the active-tab rules can be asserted against the real routes
// rather than a copy that drifts.
export const TABS = [
  { href: "/admin",          label: "DASHBOARD" },
  { href: "/admin/news",     label: "NEWS" },
  { href: "/admin/collys",   label: "COLLYS" },
  { href: "/admin/broken-collys", label: "BROKEN COLLYS" },
  { href: "/admin/users",    label: "USERS" },
  { href: "/admin/artists",  label: "ARTiSTS" },
  { href: "/admin/crews",    label: "CREWS" },
  { href: "/admin/logos",    label: "LOGOS" },
  { href: "/admin/content",  label: "APPS & MAGS" },
  { href: "/admin/polls",    label: "POLLS" },
  { href: "/admin/bbs",      label: "BBS" },
  { href: "/admin/requests", label: "REQUESTS" },
  { href: "/admin/forum",    label: "FORUM" },
  { href: "/admin/forum/reports", label: "FORUM REPORTS" },
];

// Exported so the layout invariant can be asserted in a test: the tab strip
// wraps, so it must never be height-constrained.
export const NAV_CONTAINER_STYLE: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  background: "#000000",
  // minHeight, NOT height: on a narrow window the tabs wrap to a second row.
  // A fixed 16px box left that row overflowing outside the element, where the
  // content below covered it and swallowed the clicks (the "ARTiSTS tab is
  // not clickable" report). The box now grows in whole 16px rows, so every tab
  // stays hittable at any width.
  minHeight: "16px",
  lineHeight: "16px",
  marginBottom: "16px",
};

export default function AdminNav() {
  const pathname = usePathname();
  // Exactly one tab is current; see lib/admin-nav.ts for why a bare
  // startsWith() is not enough.
  const active = activeTabHref(pathname, TABS.map(t => t.href));
  return (
    <div style={NAV_CONTAINER_STYLE}>
      {TABS.map(t => {
        const isActive = t.href === active;
        return (
          <Link
            key={t.href}
            // Admin navigation, not a content link. Prefetching every admin tab
            // on sight is a server render per tab for a page nobody opened.
            prefetch={false}
            href={t.href}
            style={{
              background: isActive ? "#212121" : "transparent",
              color: isActive ? "#ffff55" : "#aaaaaa",
              padding: "0 10px",
              height: "16px",
              lineHeight: "16px",
              fontSize: "15px",
              fontFamily: "inherit",
              textDecoration: "none",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
