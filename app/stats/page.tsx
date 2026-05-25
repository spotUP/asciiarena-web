import Link from "next/link";
import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { urlsafe, formatBytes } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

const COUNTS = [5, 10, 20, 50] as const;
type Count = (typeof COUNTS)[number];

async function getArenaStats() {
  const [collysCount, bytesResult, usersCount, commentsCount] = await Promise.all([
    prisma.collys.count(),
    prisma.$queryRaw<[{ bytes: bigint }]>(Prisma.sql`SELECT SUM(filesize) AS bytes FROM collys`),
    prisma.users.count(),
    prisma.comments.count(),
  ]);
  return { collysCount, bytes: Number(bytesResult[0]?.bytes ?? 0), usersCount, commentsCount };
}

async function getTopArtists(n: number) {
  return prisma.artists.findMany({
    where: { rating: { gt: 0 } },
    orderBy: { rating: "desc" },
    take: n,
    select: { id: true, nick: true, rating: true },
  });
}

async function getTopCrews(n: number) {
  return prisma.crews.findMany({
    where: { rating: { gt: 0 } },
    orderBy: { rating: "desc" },
    take: n,
    select: { id: true, name: true, rating: true },
  });
}

async function getTopCollys(n: number) {
  return prisma.$queryRaw<{ filename: string; rating: number }[]>(Prisma.sql`
    SELECT c.filename, c.rating
    FROM collys c
    INNER JOIN (
      SELECT colly_id FROM comments WHERE rating > 0
      GROUP BY colly_id HAVING COUNT(*) > 2
    ) v ON v.colly_id = c.id
    ORDER BY c.rating DESC
    LIMIT ${n}
  `);
}

async function getMostViewed(n: number) {
  return prisma.collys.findMany({
    orderBy: { view_counter: "desc" },
    take: n,
    select: { id: true, filename: true, view_counter: true },
  });
}

async function getMostDownloaded(n: number) {
  return prisma.collys.findMany({
    where: { downloads: { gt: 0 } },
    orderBy: { downloads: "desc" },
    take: n,
    select: { id: true, filename: true, downloads: true },
  });
}

async function getTopUploaders(n: number) {
  return prisma.users.findMany({
    where: { uploaded: { gt: 0 } },
    orderBy: { uploaded: "desc" },
    take: n,
    select: { id: true, nick: true, uploaded: true },
  });
}

async function getTopCommenters(n: number) {
  const rows = await prisma.$queryRaw<{ count: bigint; nick: string; user_id: number }[]>(
    Prisma.sql`
      SELECT COUNT(user_id) AS count, nick, user_id
      FROM comments
      GROUP BY user_id, nick
      ORDER BY count DESC
      LIMIT ${n}
    `
  );
  return rows.map(r => ({ ...r, count: Number(r.count) }));
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2 apb-1">
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">{title}</h2>
      </div>
      <div className="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
        {children}
      </div>
    </div>
  );
}

function Row({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
      {left}
      <span className="text-truncate">{right}</span>
    </div>
  );
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ count?: string }>;
}) {
  const { count: countParam } = await searchParams;
  const count: Count = (COUNTS.includes(Number(countParam) as Count) ? Number(countParam) : 10) as Count;

  const [arena, artists, crews, collys, viewed, downloaded, uploaders, commenters] = await Promise.all([
    getArenaStats(),
    getTopArtists(count),
    getTopCrews(count),
    getTopCollys(count),
    getMostViewed(count),
    getMostDownloaded(count),
    getTopUploaders(count),
    getTopCommenters(count),
  ]);

  return (
    <SiteLayout title="STATS">
      <div className="col-lg-12 pl-0 apb-1">
        <span className="lightgrey">Entries: </span>
        {COUNTS.map(n => (
          <Link
            key={n}
            href={`/stats?count=${n}`}
            className={`btn-secondary apr-1${n === count ? " active" : ""}`}
            style={{ marginRight: "4px" }}
          >
            {n}
          </Link>
        ))}
      </div>

      <Section title="aSCIIaRENA STATS">
        <Row left={<span className="white">Collys Online:</span>} right={arena.collysCount} />
        <Row left={<span className="white">Pumped Bytes:</span>} right={formatBytes(arena.bytes)} />
        <Row left={<span className="white">Users:</span>} right={arena.usersCount} />
        <Row left={<span className="white">Comments:</span>} right={arena.commentsCount} />
      </Section>

      <div className="row m-0 p-0">
        <div className="col-12 col-lg-6 pl-0 pr-lg-2">
          <Section title={`TOP ${count} ARTISTS`}>
            {artists.map(row => (
              <Row
                key={row.id}
                left={<Link className="green text-truncate" href={`/artist/${urlsafe(row.nick ?? "")}`}>{row.nick}</Link>}
                right={`${Number(row.rating ?? 0).toFixed(1)} PTS`}
              />
            ))}
          </Section>
        </div>
        <div className="col-12 col-lg-6 pl-0 pr-lg-2">
          <Section title={`TOP ${count} CREWS`}>
            {crews.map(row => (
              <Row
                key={row.id}
                left={<Link className="text-truncate" href={`/crew/${urlsafe(row.name ?? "")}/`}>{row.name}</Link>}
                right={`${Number(row.rating ?? 0).toFixed(1)} PTS`}
              />
            ))}
          </Section>
        </div>
      </div>

      <div className="row m-0 p-0">
        <div className="col-12 col-lg-6 pl-0 pr-lg-2">
          <Section title={`TOP ${count} COLLYS`}>
            {collys.map(row => (
              <Row
                key={row.filename}
                left={<Link className="magenta text-truncate" href={`/release/${row.filename}`}>{row.filename}</Link>}
                right={`${Number(row.rating).toFixed(1)} PTS`}
              />
            ))}
          </Section>
        </div>
        <div className="col-12 col-lg-6 pl-0 pr-lg-2">
          <Section title={`MOST VIEWED`}>
            {viewed.map(row => (
              <Row
                key={row.id}
                left={<Link className="magenta text-truncate" href={`/release/${row.filename ?? ""}`}>{row.filename}</Link>}
                right={row.view_counter}
              />
            ))}
          </Section>
        </div>
      </div>

      <div className="row m-0 p-0">
        <div className="col-12 col-lg-6 pl-0 pr-lg-2">
          <Section title={`MOST DOWNLOADED`}>
            {downloaded.map(row => (
              <Row
                key={row.id}
                left={<Link className="magenta text-truncate" href={`/release/${row.filename ?? ""}`}>{row.filename}</Link>}
                right={row.downloads}
              />
            ))}
          </Section>
        </div>
        <div className="col-12 col-lg-6 pl-0 pr-lg-2">
          <Section title={`TOP UPLOADERS`}>
            {uploaders.map(row => (
              <Row
                key={row.id}
                left={<Link className="text-truncate" href={`/member/${urlsafe(row.nick ?? "")}`}>{row.nick}</Link>}
                right={formatBytes(row.uploaded ?? 0)}
              />
            ))}
          </Section>
        </div>
      </div>

      <div className="row m-0 p-0">
        <div className="col-12 col-lg-6 pl-0 pr-lg-2">
          <Section title={`TOP COMMENTERS`}>
            {commenters.map(row => (
              <Row
                key={row.user_id}
                left={<Link className="yellow text-truncate" href={`/member/${urlsafe(row.nick)}`}>{row.nick}</Link>}
                right={row.count}
              />
            ))}
          </Section>
        </div>
      </div>
    </SiteLayout>
  );
}
