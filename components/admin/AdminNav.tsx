"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin",          label: "Dashboard" },
  { href: "/admin/collys",   label: "Collys" },
  { href: "/admin/users",    label: "Users" },
  { href: "/admin/artists",  label: "Artists" },
  { href: "/admin/crews",    label: "Crews" },
  { href: "/admin/logos",    label: "Logos" },
  { href: "/admin/content",  label: "Apps & Mags" },
  { href: "/admin/bbs",      label: "BBS" },
  { href: "/admin/requests", label: "Requests" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="col-lg-12 p-0" style={{ marginBottom: "8px", display: "flex", flexWrap: "wrap", gap: "2px", borderBottom: "1px solid #444", paddingBottom: "6px" }}>
      {links.map(l => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              padding: "2px 8px",
              fontFamily: "TopazPlus_a1200, monospace",
              fontSize: "13px",
              color: active ? "#ffff55" : "#aaaaaa",
              backgroundColor: active ? "#333" : "transparent",
              textDecoration: "none",
              border: active ? "1px solid #555" : "1px solid transparent",
            }}
          >
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}
