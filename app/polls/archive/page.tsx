import Link from "next/link";
import { prisma } from "@/lib/db";
import SiteLayout from "@/components/layout/SiteLayout";
import { POLL_TYPE_LABELS } from "@/lib/polls/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function PollArchivePage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.p ?? "1"));
  const skip = (page - 1) * PAGE_SIZE;

  const [polls, total] = await Promise.all([
    prisma.polls.findMany({
      where: { status: "closed" },
      orderBy: { updated_at: "desc" },
      skip, take: PAGE_SIZE,
      include: { _count: { select: { votes: true } } },
    }),
    prisma.polls.count({ where: { status: "closed" } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <SiteLayout title="pOLL aRCHIVE">
      <div className="container-fluid bg-secondary apb-1 ap-1" style={{ marginBottom: "16px" }}>
        {polls.length === 0 && <div style={{ color: "#aaaaaa" }}>No closed polls yet.</div>}
        {polls.map(p => (
          <div key={p.id} className="col-lg-12 p-0 d-flex" style={{ gap: "16px", height: "16px", lineHeight: "16px", marginBottom: "8px" }}>
            <Link href={`/polls/${p.slug}`} className="magenta" style={{ minWidth: "320px", fontFamily: "TopazPlus_a1200, monospace" }}>
              {p.title}
            </Link>
            <span className="lightgrey" style={{ minWidth: "144px" }}>{POLL_TYPE_LABELS[p.type]}</span>
            <span className="lightgrey" style={{ minWidth: "96px" }}>{p._count.votes} votes</span>
            <span className="lightgrey" style={{ minWidth: "144px" }}>{new Date(p.updated_at * 1000).toISOString().slice(0, 10)}</span>
          </div>
        ))}
      </div>
      {pages > 1 && (
        <div style={{ display: "flex", gap: "16px", fontFamily: "TopazPlus_a1200, monospace" }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
            <Link key={n} href={`/polls/archive?p=${n}`} style={{
              color: n === page ? "#ffff55" : "#aaaaaa",
              textDecoration: n === page ? "none" : "underline",
            }}>{n}</Link>
          ))}
        </div>
      )}
    </SiteLayout>
  );
}
