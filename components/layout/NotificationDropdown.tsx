"use client";

import Link from "next/link";
import type { NotifRow } from "./NotificationBell";
import { describeNotification } from "@/lib/notificationLabel";

interface Props {
  items: NotifRow[];
  unread: number;
  onMarkAll: () => void;
  onClose: () => void;
}


function fmtAgo(unixSec: number): string {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - unixSec);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationDropdown({ items, unread, onMarkAll, onClose }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        right: 0,
        zIndex: 300,
        width: "400px",
        maxHeight: "640px",
        overflowY: "auto",
        background: "#222222",
        border: "0",
        fontFamily: "TopazPlus_a1200, monospace",
        fontSize: "16px",
        lineHeight: "16px",
      }}
    >
      <div
        className="bg-header"
        style={{
          height: "16px",
          padding: "0 8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span className="yellow">NOTIFICATIONS</span>
        {unread > 0 && (
          <button
            onClick={onMarkAll}
            className="lightgrey"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              lineHeight: "16px",
              padding: 0,
              fontFamily: "inherit",
            }}
          >
            [mark all read]
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div
          className="lightgrey"
          style={{ padding: "16px 8px", textAlign: "center" }}
        >
          No notifications yet.
        </div>
      ) : (
        items.map((n) => {
          const label = describeNotification(n);
          const isUnread = n.readAt === null;
          const content = (
            <div
              style={{
                padding: "0 8px",
                background: isUnread ? "#000084" : "transparent",
                cursor: n.targetUrl ? "pointer" : "default",
                minHeight: "32px",
              }}
            >
              <div style={{ lineHeight: "16px" }}>
                <span className={isUnread ? "magenta" : "lightgrey"}>{label.actor}</span>{" "}
                <span className="lightgrey">{label.verb}</span>
                {label.target && (
                  <>
                    {" "}
                    <span className="cyan">{label.target}</span>
                  </>
                )}
              </div>
              <div className="lightgrey" style={{ lineHeight: "16px" }}>
                {fmtAgo(n.createdAt)}
              </div>
            </div>
          );
          return n.targetUrl ? (
            <Link prefetch={false} key={n.id} href={n.targetUrl} onClick={onClose} style={{ textDecoration: "none" }}>
              {content}
            </Link>
          ) : (
            <div key={n.id}>{content}</div>
          );
        })
      )}
    </div>
  );
}
