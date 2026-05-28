"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function RecentlyViewed() {
  const [items, setItems] = useState<Array<{ filename: string; name: string }>>([]);
  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem("recentlyViewed") ?? "[]"));
    } catch {}
  }, []);
  if (items.length === 0) return null;
  return (
    <div className="container-fluid m-0 p-0 apb-1">
      <div className="header col-12 p-0">
        <h2 className="ap-1 am-0 bg-header">RECENTLY VIEWED</h2>
      </div>
      <div className="col-12 bg-secondary ap-1 apb-1">
        {items.map(r => (
          <div key={r.filename} className="text-truncate" style={{ height: "16px", lineHeight: "16px", fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px" }}>
            <Link className="magenta" href={`/release/${r.filename}`}>{r.name ?? r.filename}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
