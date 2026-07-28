"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

export interface ReportRow {
  id: number;
  reason: string;
  createdAt: number;
  reporterNick: string | null;
  authorNick: string | null;
  postId: number;
  postExcerpt: string;
  postDeleted: boolean;
  topicTitle: string;
  topicLocked: boolean;
  href: string;
}

function stamp(unix: number): string {
  const d = new Date(unix * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

export default function ReportsClient({ reports }: { reports: ReportRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<number | null>(null);

  const resolve = async (id: number, resolution: "dismissed" | "deleted" | "locked") => {
    if (busy != null) return;
    setBusy(id);
    const res = await fetch(`/api/admin/forum/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution }),
    });
    setBusy(null);
    if (res.ok) {
      toast(`[OK] Report ${resolution}.`);
      router.refresh();
    } else {
      toast("[!] Could not resolve the report. Try again.", "danger");
    }
  };

  if (reports.length === 0) {
    return <div className="container-fluid bg-secondary ap-1 lightgrey">Nothing awaiting review.</div>;
  }

  return (
    <>
      {reports.map(r => (
        <div key={r.id} className="container-fluid bg-secondary ap-1" style={{ marginBottom: "16px" }}>
          <div className="d-flex justify-content-between" style={{ height: "16px", lineHeight: "16px" }}>
            <span>
              <span className="yellow">{r.reporterNick ?? "unknown"}</span>
              <span className="lightgrey"> reported </span>
              <span className="yellow">{r.authorNick ?? "unknown"}</span>
            </span>
            <span className="lightgrey">{stamp(r.createdAt)}</span>
          </div>

          <div className="lightred" style={{ marginTop: "16px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {r.reason}
          </div>

          <div style={{ marginTop: "16px" }}>
            <Link prefetch={false} href={r.href} className="magenta">
              {r.topicTitle}
            </Link>
            {r.postDeleted && <span className="lightred">{" [POST ALREADY DELETED]"}</span>}
            {r.topicLocked && <span className="lightred">{" [TOPIC ALREADY LOCKED]"}</span>}
          </div>

          <div
            className="lightgrey"
            style={{ marginTop: "16px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            {r.postExcerpt || "(no text -- this post is ANSI art)"}
          </div>

          <div className="d-flex apt-1" style={{ gap: "8px" }}>
            <button className="btn-secondary apr-1" disabled={busy != null} onClick={() => resolve(r.id, "dismissed")}>
              DISMISS
            </button>
            <button className="btn-secondary apr-1" disabled={busy != null} onClick={() => resolve(r.id, "deleted")}>
              DELETE POST
            </button>
            <button className="btn-secondary apr-1" disabled={busy != null} onClick={() => resolve(r.id, "locked")}>
              LOCK TOPIC
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
