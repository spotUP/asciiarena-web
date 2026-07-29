import ContentLink from "@/components/ui/ContentLink";
import { prisma } from "@/lib/db";
import SiteLayout from "@/components/layout/SiteLayout";
import LiveRefresh from "@/components/widgets/LiveRefresh";
import { POLL_TYPE_LABELS } from "@/lib/polls/types";
import { livePollWhere, nowSec } from "@/lib/polls/state";

export const dynamic = "force-dynamic";

export default async function PollsListPage() {
  const polls = await prisma.polls.findMany({
    where: livePollWhere(nowSec()),
    orderBy: [{ featured: "desc" }, { updated_at: "desc" }],
    include: { _count: { select: { votes: true, options: true } } },
  });

  return (
    <SiteLayout title="cOMMUNITY pOLLS">
      <LiveRefresh channel="site:polls" />
      <div className="container-fluid bg-secondary apb-1 ap-1" style={{ marginBottom: "16px" }}>
        {polls.length === 0 && <div style={{ color: "#aaaaaa" }}>No active polls. Check back soon.</div>}
        {polls.map(p => (
          <div key={p.id} className="col-lg-12 p-0 d-flex" style={{ gap: "16px", height: "16px", lineHeight: "16px", marginBottom: "8px" }}>
            <span style={{ minWidth: "16px", color: p.featured ? "#ffff55" : "#5e5d5e" }}>{p.featured ? "*" : " "}</span>
            <ContentLink href={`/polls/${p.slug}`} className="magenta" style={{ minWidth: "320px", fontFamily: "TopazPlus_a1200, monospace" }}>
              {p.title}
            </ContentLink>
            <span className="lightgrey" style={{ minWidth: "144px" }}>{POLL_TYPE_LABELS[p.type]}</span>
            <span className="lightgrey" style={{ minWidth: "96px" }}>{p._count.votes} votes</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "16px" }}>
        <ContentLink href="/polls/archive" className="lightgrey" style={{ fontFamily: "TopazPlus_a1200, monospace" }}>
          {"[ See all past polls -> ]"}
        </ContentLink>
      </div>
    </SiteLayout>
  );
}
