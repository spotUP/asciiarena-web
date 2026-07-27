import Link from "next/link";
import { prisma } from "@/lib/db";
import { POLL_TYPE_LABELS } from "@/lib/polls/types";
import { isPollExpired, isPollPending, nowSec } from "@/lib/polls/state";

export const dynamic = "force-dynamic";

function fmtTs(ts: number | null): string {
  if (!ts) return "-";
  return new Date(ts * 1000).toISOString().slice(0, 16).replace("T", " ");
}

export default async function AdminPollsList() {
  const now = nowSec();
  const polls = await prisma.polls.findMany({
    orderBy: [{ featured: "desc" }, { updated_at: "desc" }],
    include: { _count: { select: { votes: true, options: true } } },
  });

  return (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">POLLS</h2>
      </div>
      <div style={{ marginBottom: "16px" }}>
        <Link href="/admin/polls/new" style={{
          display: "inline-block", height: "32px", lineHeight: "32px", padding: "0 16px",
          background: "#212121", color: "#ffff55", border: "1px solid #555",
          fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", textDecoration: "none",
        }}>+ NEW POLL</Link>
      </div>
      <div className="container-fluid bg-secondary apb-1 ap-1">
        {polls.length === 0 && <div style={{ color: "#aaaaaa" }}>No polls yet.</div>}
        {polls.map((p) => (
          <div key={p.id} className="col-lg-12 p-0 d-flex" style={{ gap: "16px", height: "16px", lineHeight: "16px", marginBottom: "8px" }}>
            <span style={{ minWidth: "16px", color: p.featured ? "#ffff55" : "#5e5d5e" }}>
              {p.featured ? "*" : " "}
            </span>
            <span style={{
              minWidth: "64px",
              color: p.status === "open" ? "#B6D1AA" : p.status === "closed" ? "#5e5d5e" : "#F4D799",
            }}>[{p.status}]</span>
            {/* The row says "open" but the clock disagrees — show what visitors
                actually see, since the status column is never rewritten. */}
            <span style={{ minWidth: "112px", color: "#5e5d5e" }}>
              {isPollExpired(p, now) ? "-> ended" : isPollPending(p, now) ? "-> scheduled" : ""}
            </span>
            <Link className="magenta" href={`/admin/polls/${p.id}`} style={{ minWidth: "320px", fontFamily: "TopazPlus_a1200, monospace" }}>
              {p.title}
            </Link>
            <span className="lightgrey" style={{ minWidth: "144px" }}>{POLL_TYPE_LABELS[p.type]}</span>
            <span className="lightgrey" style={{ minWidth: "80px" }}>{p._count.options} opts</span>
            <span className="lightgrey" style={{ minWidth: "96px" }}>{p._count.votes} votes</span>
            <span className="lightgrey" style={{ minWidth: "144px" }}>{fmtTs(p.updated_at)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
