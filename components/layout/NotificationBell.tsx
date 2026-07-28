"use client";

import { useEffect, useRef, useState } from "react";
import NotificationDropdown from "./NotificationDropdown";
import { subscribeRaw } from "@/lib/sse-pool";

interface ListPayload {
  notifications: NotifRow[];
  unreadCount: number;
}

export interface NotifRow {
  id: number;
  kind: string;
  actorNick: string | null;
  target: string | null;
  targetUrl: string | null;
  readAt: number | null;
  createdAt: number;
}

interface Props {
  userId: number;
}

export default function NotificationBell({ userId }: Props) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotifRow[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const reload = async () => {
    try {
      const r = await fetch("/api/notifications?limit=20");
      if (!r.ok) return;
      const data = (await r.json()) as ListPayload;
      setItems(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    reload();
    return subscribeRaw(`user:${userId}:notifications`, (evt) => {
      if (evt?.type === "new") reload();
    });
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markAll = async () => {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: "all" }),
    }).catch(() => {});
    reload();
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Notifications"
        className="lightgrey"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0 8px",
          height: "16px",
          lineHeight: "16px",
          fontFamily: "inherit",
          fontSize: "16px",
        }}
      >
        <span style={{ color: unread > 0 ? "#ff55ff" : "#aaaaaa" }}>[bell]</span>
        {unread > 0 && (
          <span
            className="red"
            style={{ marginLeft: "8px" }}
          >
            ({unread})
          </span>
        )}
      </button>
      {open && (
        <NotificationDropdown
          items={items}
          unread={unread}
          onMarkAll={markAll}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
