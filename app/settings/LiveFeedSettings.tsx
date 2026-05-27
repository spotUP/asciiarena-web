"use client";

import { useEffect, useId, useState } from "react";
import { ACTIVITY_TYPES, ACTIVITY_LABELS, type ActivityType } from "@/lib/activity-types";

export default function LiveFeedSettings() {
  const [hidden, setHidden] = useState<Set<ActivityType>>(new Set());
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const baseId = useId();

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
    <div className="container-fluid bg-secondary amb-1 apb-1 ap-1">
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">LIVE FEED PRIVACY</h2>
      </div>
      <div className="col-lg-12 p-0 lightgrey amb-1">
        By default, none of your actions are broadcast — you opt in here per action.
        A toggle that is ON means that action stays <span className="yellow">hidden</span> from
        the live feed. Switch it OFF to share that action with others.
      </div>
      <div className="col-lg-12 p-0">
        {ACTIVITY_TYPES.map(type => {
          const id = `${baseId}-${type}`;
          return (
            <div key={type} className="form-check form-switch">
              <input
                type="checkbox"
                className="form-check-input"
                id={id}
                checked={hidden.has(type)}
                onChange={() => toggle(type)}
              />
              <label className="form-check-label" htmlFor={id}>
                Hide <span className="yellow">{ACTIVITY_LABELS[type]}</span>
              </label>
            </div>
          );
        })}
        {status && <div className="lightgrey amt-1">{status}</div>}
      </div>
    </div>
  );
}
