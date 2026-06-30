import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { urlsafe, decodeParam } from "@/lib/utils";
import LiveRefresh from "@/components/widgets/LiveRefresh";
import WatchingPip from "@/components/widgets/WatchingPip";
import EntityLogosSection from "@/components/release/EntityLogosSection";
import SceneLinksSection from "@/components/release/SceneLinksSection";
import { logosForEntity } from "@/lib/collyLogoSearch";
import { crewsWith } from "@/lib/sceneGraph";

interface PageProps {
  params: Promise<{ name: string }>;
}

interface ReleaseRow {
  colly_id: number;
  filename: string;
  name: string | null;
  year: number | null;
}

interface MemberRow {
  id: number;
  nick: string;
  crew: string | null;
  artisturl: string | null;
  user_nickurl: string | null;
}

interface BoardRow {
  bbs_id: number | null;
  bbs_name: string;
  sysop: string | null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { name: rawCrewurl } = await params;
  const crewurl = decodeParam(rawCrewurl);
  const crew = await prisma.crews.findFirst({ where: { crewurl } });
  if (!crew) return {};

  const [memberCount, releaseCount] = await Promise.all([
    prisma.member_of.count({ where: { crew: crew.name } }),
    prisma.collys_crews.count({ where: { crew_id: crew.id } }),
  ]);
  const description = `${crew.name} ASCII crew - ${memberCount} member${memberCount !== 1 ? "s" : ""}, ${releaseCount} release${releaseCount !== 1 ? "s" : ""} on aSCIIaRENA`;

  return {
    title: `${crew.name} ASCII crew | aSCIIaRENA`,
    description,
    openGraph: { title: `${crew.name} ASCII crew | aSCIIaRENA`, url: `/crew/${crewurl}` },
  };
}

export default async function CrewPage({ params }: PageProps) {
  const { name: rawCrewurl } = await params;
  const crewurl = decodeParam(rawCrewurl);

  const crew = await prisma.crews.findFirst({
    where: { crewurl },
  });
  if (!crew) notFound();

  const [members, crewCollys, releaseRows, boards] = await Promise.all([
    prisma.$queryRaw<MemberRow[]>`
      SELECT mo.id, mo.nick, mo.crew, a.artisturl, u.nickurl AS user_nickurl
      FROM member_of mo
      LEFT JOIN artists a ON LOWER(a.nick) = LOWER(mo.nick)
      LEFT JOIN users u ON u.id = a.user_id
      WHERE mo.crew = ${crew.name}
      ORDER BY mo.nick ASC
    `,
    prisma.collys_crews.findMany({ where: { crew_id: crew.id }, select: { colly_id: true } }),
    prisma.collys_crews.findMany({
      where: { crew_id: crew.id },
      include: { collys: { select: { id: true, filename: true, name: true, year: true } } },
      orderBy: { collys: { filename: "asc" } },
    }),
    // BBS affiliations via the bbs_of join table (legacy schema — same column
    // shape PHP's info_crew.php read). Left-join into bbses to surface the
    // sysop and a stable link target.
    prisma.$queryRaw<BoardRow[]>`
      SELECT b.id AS bbs_id, bo.name AS bbs_name, b.sysop
      FROM bbs_of bo
      LEFT JOIN bbses b ON LOWER(b.name) = LOWER(bo.name)
      WHERE bo.crew = ${crew.name}
      ORDER BY bo.name ASC
    `,
  ]);

  const collyIds = crewCollys.map((r) => r.colly_id);
  const voteCount = collyIds.length > 0
    ? await prisma.comments.count({ where: { colly_id: { in: collyIds }, rating: { gt: 0 } } })
    : 0;

  // "Awaiting N votes" only while votes are still needed; once enough votes
  // exist, show the rating (never the nonsensical "Awaiting 0 votes").
  const neededVotes = Math.max(0, 3 - voteCount);
  const ratingDisplay = (crew.rating && crew.rating > 0)
    ? `${crew.rating.toFixed(1)} (${voteCount} votes)`
    : neededVotes > 0
      ? `Awaiting ${neededVotes} vote${neededVotes !== 1 ? "s" : ""}`
      : `${Number(crew.rating ?? 0).toFixed(1)} (${voteCount} votes)`;
  const releases: ReleaseRow[] = releaseRows.map(r => ({
    colly_id: r.colly_id,
    filename: r.collys.filename,
    name: r.collys.name,
    year: r.collys.year,
  }));

  return (
    <SiteLayout title="CREW iNFO">
      <LiveRefresh channel="site:votes" />
      <div className="row apb-1">
        <div className="header col-lg-12">
          <h2 className="ap-1 bg-header">
            {crew.name}
            <WatchingPip channel={`viewing:crew:${crew.id}`} />
          </h2>
        </div>
      </div>

      <div className="col-lg-12 pl-0">
        <span className="lightgrey">Name: </span>
        {crew.name}
      </div>
      {crew.acronym && (
        <div className="col-lg-12 pl-0">
          <span className="lightgrey">Acronym: </span>
          {crew.acronym}
        </div>
      )}
      {crew.www && (
        <div className="col-lg-12 pl-0">
          <span className="lightgrey">Website: </span>
          <a href={crew.www} target="_blank" rel="noopener noreferrer">
            {crew.www}
          </a>
        </div>
      )}
      {crew.contact && (
        <div className="col-lg-12 pl-0">
          <span className="lightgrey">Contact: </span>
          {crew.contact}
        </div>
      )}
      <div className="col-lg-12 pl-0">
        <span className="lightgrey">Status: </span>
        {crew.active}
      </div>
      <div className="col-lg-12 pl-0">
        <span className="lightgrey">Rating: </span>
        {ratingDisplay}
      </div>
      <div className="col-lg-12 pl-0">
        <span className="lightgrey">Releases: </span>
        {releases.length}
      </div>

      {/* Members */}
      <div className="row apt-1 apb-1">
        <h2 className="bg-header">Members</h2>
      </div>
      {members.length > 0 ? (
        members.map((m) => (
          <div key={m.id} className="col-lg-12 pl-0 d-flex" style={{ gap: "12px" }}>
            {m.artisturl
              ? <Link href={`/artist/${m.artisturl}`}>{m.nick}</Link>
              : <span>{m.nick}</span>}
            {m.user_nickurl && (
              <Link className="lightgrey" href={`/member/${m.user_nickurl}`}>[profile]</Link>
            )}
          </div>
        ))
      ) : (
        <div className="col-lg-12 pl-0 lightgrey">No members listed.</div>
      )}

      {/* Boards — affiliated BBSes via the bbs_of join table. */}
      {boards.length > 0 && (
        <>
          <div className="row apt-1 apb-1">
            <h2 className="bg-header">Boards</h2>
          </div>
          {boards.map((b, i) => (
            <div key={`${b.bbs_id ?? "x"}-${i}`} className="col-lg-12 pl-0 d-flex" style={{ gap: "12px" }}>
              {b.bbs_id ? (
                <Link className="magenta" href={`/bbs/${b.bbs_id}`}>{b.bbs_name}</Link>
              ) : (
                <span>{b.bbs_name}</span>
              )}
              {b.sysop && <span className="lightgrey">sysop {b.sysop}</span>}
            </div>
          ))}
        </>
      )}

      {/* Releases */}
      <div className="row apt-1 apb-1">
        <h2 className="bg-header">Releases</h2>
      </div>
      {releases.length > 0 ? (
        releases.map((r) => (
          <div key={r.colly_id} className="col-lg-12 d-flex justify-content-between pl-0">
            <div className="col-lg-6 pl-0">
              <Link className="magenta" href={`/release/${r.filename}`}>
                {r.filename}
              </Link>
            </div>
            <div className="col-lg-3 pl-0 lightgrey">
              {r.name?.slice(0, 40) ?? ""}
            </div>
            <div className="col-lg-3 pl-0">
              <span className="lightgrey">{r.year ?? "-"}</span>
            </div>
          </div>
        ))
      ) : (
        <div className="col-lg-12 pl-0 lightgrey">No releases found.</div>
      )}

      <EntityLogosSection hits={await logosForEntity("crew", crew.id)} title={`Collys with a ${crew.name} logo`} />
      <SceneLinksSection links={await crewsWith(crew.id)} title={`${crew.name} appears with`} color="magenta" />
    </SiteLayout>
  );
}
