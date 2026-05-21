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
    <div className="amb-1">
      <div className="white apb-1">Recently Viewed</div>
      {items.map(r => (
        <div key={r.filename} className="text-truncate">
          <Link className="magenta" href={`/release/${r.filename}`}>{r.name ?? r.filename}</Link>
        </div>
      ))}
    </div>
  );
}
