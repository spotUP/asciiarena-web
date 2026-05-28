import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import Link from "next/link";
import LiveRefresh from "@/components/widgets/LiveRefresh";

interface StatRow { cnt: bigint | number }

async function getStats() {
  const cutoff30d = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
  const [
    [users], [activeUsers], [collys], [broken], [pending], [unclaimed], recentUploads,
  ] = await Promise.all([
    prisma.$queryRaw<StatRow[]>`SELECT COUNT(*) AS cnt FROM users`,
    prisma.$queryRaw<StatRow[]>`SELECT COUNT(*) AS cnt FROM users WHERE lastactive > ${cutoff30d}`,
    prisma.$queryRaw<StatRow[]>`SELECT COUNT(*) AS cnt FROM collys`,
    prisma.$queryRaw<StatRow[]>`SELECT COUNT(*) AS cnt FROM collys WHERE broken = 1`,
    prisma.$queryRaw<StatRow[]>`SELECT COUNT(*) AS cnt FROM requests WHERE status = 0`,
    prisma.$queryRaw<StatRow[]>`SELECT COUNT(*) AS cnt FROM artists WHERE user_id IS NULL`,
    prisma.$queryRaw<{ filename: string; name: string | null; uploader: string | null; timestamp: number | null }[]>`
      SELECT filename, name, uploader, timestamp FROM collys ORDER BY timestamp DESC LIMIT 8
    `,
  ]);
  return {
    users: Number(users?.cnt ?? 0),
    activeUsers: Number(activeUsers?.cnt ?? 0),
    collys: Number(collys?.cnt ?? 0),
    broken: Number(broken?.cnt ?? 0),
    pending: Number(pending?.cnt ?? 0),
    unclaimed: Number(unclaimed?.cnt ?? 0),
    recentUploads,
  };
}

function StatCard({ label, value, href, warn }: { label: string; value: number; href?: string; warn?: boolean }) {
  const color = warn && value > 0 ? "#ff5555" : "#ffff55";
  const content = (
    <div style={{
      padding: "8px 16px",
      backgroundColor: "#212121",
      minWidth: "160px",
      height: "64px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    }}>
      <div style={{ color: "#aaaaaa", fontSize: "16px", lineHeight: "16px", marginBottom: "8px" }}>{label}</div>
      <div style={{ color, fontSize: "32px", lineHeight: "32px", fontFamily: "TopazPlus_a1200, monospace" }}>{value}</div>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: "none" }}>{content}</Link> : content;
}

function formatTs(ts: number | null): string {
  if (!ts) return "-";
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <>
      <LiveRefresh channel="site:releases" />
      <LiveRefresh channel="site:users" />
      <LiveRefresh channel="site:requests" />
      <LiveRefresh channel="site:comments" />
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">DASHBOARD</h2>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "32px" }}>
        <StatCard label="TOTAL USERS"       value={stats.users}      href="/admin/users" />
        <StatCard label="ACTIVE 30D"        value={stats.activeUsers} />
        <StatCard label="TOTAL COLLYS"      value={stats.collys}     href="/admin/collys" />
        <StatCard label="BROKEN COLLYS"     value={stats.broken}     href="/admin/collys" warn />
        <StatCard label="OPEN REQUESTS"     value={stats.pending}    href="/admin/requests" warn />
        <StatCard label="UNCLAIMED ARTISTS" value={stats.unclaimed}  href="/admin/artists" />
      </div>

      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">RECENT UPLOADS</h2>
      </div>
      <div className="container-fluid bg-secondary apb-1 ap-1">
        {stats.recentUploads.map((r, i) => (
          <div key={i} className="col-lg-12 p-0 d-flex" style={{ gap: "16px", height: "16px", lineHeight: "16px" }}>
            <Link className="magenta" href={`/release/${r.filename}`} style={{ minWidth: "240px", fontFamily: "TopazPlus_a1200, monospace" }}>
              {r.filename}
            </Link>
            <span className="lightgrey" style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.name ?? "-"}
            </span>
            <span className="lightgrey" style={{ minWidth: "96px" }}>{r.uploader ?? "-"}</span>
            <span className="lightgrey" style={{ minWidth: "96px" }}>{formatTs(r.timestamp)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
