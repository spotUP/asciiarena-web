"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin",          label: "DASHBOARD" },
  { href: "/admin/collys",   label: "COLLYS" },
  { href: "/admin/users",    label: "USERS" },
  { href: "/admin/artists",  label: "ARTiSTS" },
  { href: "/admin/crews",    label: "CREWS" },
  { href: "/admin/logos",    label: "LOGOS" },
  { href: "/admin/content",  label: "APPS & MAGS" },
  { href: "/admin/polls",    label: "POLLS" },
  { href: "/admin/bbs",      label: "BBS" },
  { href: "/admin/requests", label: "REQUESTS" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        background: "#000000",
        height: "16px",
        lineHeight: "16px",
        marginBottom: "16px",
      }}
    >
      {TABS.map(t => {
        const isActive = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            style={{
              background: isActive ? "#212121" : "transparent",
              color: isActive ? "#ffff55" : "#aaaaaa",
              padding: "0 16px",
              height: "16px",
              lineHeight: "16px",
              fontSize: "16px",
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
