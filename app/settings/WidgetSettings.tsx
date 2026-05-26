"use client";

import { useEffect, useState } from "react";
import { WIDGET_GROUPS, WIDGET_LABELS, type WidgetKey } from "@/lib/widgets-types";

export default function WidgetSettings() {
  const [hidden, setHidden] = useState<Set<WidgetKey>>(new Set());
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/settings/widgets")
      .then(r => r.ok ? r.json() : null)
      .then((d: { hidden?: string[] } | null) => {
        if (d?.hidden) setHidden(new Set(d.hidden as WidgetKey[]));
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = async (next: Set<WidgetKey>) => {
    setStatus("saving...");
    const res = await fetch("/api/settings/widgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: Array.from(next) }),
    });
    setStatus(res.ok ? "saved (reload to see)" : "save failed");
    setTimeout(() => setStatus(""), 2500);
  };

  const toggle = (key: WidgetKey) => {
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setHidden(next);
    persist(next);
  };

  if (loading) return null;

  return (
    <div className="row apt-1 apb-1">
      <div className="col-lg-12 p-0">
        <h2 className="ap-1 bg-header">WiDGETS</h2>
      </div>
      <div className="col-lg-12 p-0 apt-1 lightgrey" style={{ fontSize: "13px" }}>
        Hide any widget you don&apos;t want to see on your screen. Boxes you tick are
        <span className="yellow"> hidden </span>
        for you — other users are not affected. Reload after a change to see the new layout.
      </div>
      {WIDGET_GROUPS.map(group => (
        <div key={group.label} className="col-lg-12 p-0 apt-1">
          <div className="white" style={{ fontSize: "13px", marginBottom: "4px" }}>
            {group.label}
          </div>
          {group.keys.map(key => (
            <label key={key} style={{ display: "block", padding: "1px 0 1px 8px", cursor: "pointer", fontSize: "13px" }}>
              <input
                type="checkbox"
                checked={hidden.has(key)}
                onChange={() => toggle(key)}
                style={{ marginRight: "8px", verticalAlign: "middle" }}
              />
              Hide <span className="yellow">{WIDGET_LABELS[key]}</span>
            </label>
          ))}
        </div>
      ))}
      {status && <div className="col-lg-12 p-0 apt-1 lightgrey" style={{ fontSize: "12px" }}>{status}</div>}
    </div>
  );
}
