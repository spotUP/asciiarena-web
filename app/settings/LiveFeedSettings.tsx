"use client";

import { useEffect, useState } from "react";
import { ACTIVITY_TYPES, ACTIVITY_LABELS, type ActivityType } from "@/lib/activity-types";

export default function LiveFeedSettings() {
  const [hidden, setHidden] = useState<Set<ActivityType>>(new Set());
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/settings/activity")
      .then(r => r.ok ? r.json() : null)
      .then((d: { hidden?: string[] } | null) => {
        if (d?.hidden) setHidden(new Set(d.hidden as ActivityType[]));
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (type: ActivityType) => {
    const next = new Set(hidden);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    setHidden(next);
    setStatus("saving...");
    const res = await fetch("/api/settings/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: Array.from(next) }),
    });
    setStatus(res.ok ? "saved" : "save failed");
    setTimeout(() => setStatus(""), 1500);
  };

  if (loading) return null;

  return (
    <div className="row apt-1 apb-1">
      <div className="col-lg-12 p-0">
        <h2 className="ap-1 bg-header">LIVE FEED PRIVACY</h2>
      </div>
      <div className="col-lg-12 p-0 apt-1 lightgrey" style={{ fontSize: "13px" }}>
        Pick which of your actions get broadcast to the site live feed. Boxes you
        tick are <span className="yellow">hidden</span> from others — your action still happens, just no live feed entry.
      </div>
      <div className="col-lg-12 p-0 apt-1">
        {ACTIVITY_TYPES.map(type => (
          <label key={type} style={{ display: "block", padding: "2px 0", cursor: "pointer", fontSize: "14px" }}>
            <input
              type="checkbox"
              checked={hidden.has(type)}
              onChange={() => toggle(type)}
              style={{ marginRight: "8px", verticalAlign: "middle" }}
            />
            Hide <span className="yellow">{ACTIVITY_LABELS[type]}</span>
          </label>
        ))}
        {status && <div className="lightgrey apt-1" style={{ fontSize: "12px" }}>{status}</div>}
      </div>
    </div>
  );
}
