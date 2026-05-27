"use client";

import { useEffect, useId, useState } from "react";
import { WIDGET_GROUPS, WIDGET_LABELS, type WidgetKey } from "@/lib/widgets-types";

export default function WidgetSettings() {
  const [hidden, setHidden] = useState<Set<WidgetKey>>(new Set());
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const baseId = useId();

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
    setStatus(res.ok ? "saved" : "save failed");
    setTimeout(() => setStatus(""), 1500);
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
    <div className="container-fluid bg-secondary amb-1 apb-1 ap-1">
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">WiDGETS</h2>
      </div>
      <div className="col-lg-12 p-0 lightgrey amb-1">
        Hide any widget you don&apos;t want to see on your screen. Toggles you flip ON are
        <span className="yellow"> hidden </span>
        for you — other users are not affected. Changes apply live to every open tab.
      </div>
      {WIDGET_GROUPS.map(group => (
        <div key={group.label} className="col-lg-12 p-0 amt-1">
          <div className="white">{group.label}</div>
          {group.keys.map(key => {
            const id = `${baseId}-${key}`;
            return (
              <div key={key} className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id={id}
                  checked={hidden.has(key)}
                  onChange={() => toggle(key)}
                />
                <label className="form-check-label" htmlFor={id}>
                  Hide <span className="yellow">{WIDGET_LABELS[key]}</span>
                </label>
              </div>
            );
          })}
        </div>
      ))}
      {status && <div className="col-lg-12 p-0 amt-1 lightgrey">{status}</div>}
    </div>
  );
}
