import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { name: crewurl } = await params;
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
  const { name: crewurl } = await params;

  const crew = await prisma.crews.findFirst({
    where: { crewurl },
  });
  if (!crew) notFound();

  // Members with optional user profile link
  const members = await prisma.$queryRaw<MemberRow[]>`
    SELECT mo.id, mo.nick, mo.crew, a.artisturl, u.nickurl AS user_nickurl
    FROM member_of mo
    LEFT JOIN artists a ON LOWER(a.nick) = LOWER(mo.nick)
    LEFT JOIN users u ON u.id = a.user_id
    WHERE mo.crew = ${crew.name}
    ORDER BY mo.nick ASC
  `;

  // Vote count for rating display
  const crewCollys = await prisma.collys_crews.findMany({
    where: { crew_id: crew.id },
    select: { colly_id: true },
  });
  const collyIds = crewCollys.map((r) => r.colly_id);

  let voteCount = 0;
  if (collyIds.length > 0) {
    voteCount = await prisma.comments.count({
      where: { colly_id: { in: collyIds }, rating: { gt: 0 } },
    });
  }

  const ratingDisplay =
    !crew.rating || crew.rating === 0
      ? `Awaiting ${Math.max(0, 3 - voteCount)} votes`
      : `${crew.rating.toFixed(1)} (${voteCount} votes)`;

  // All releases for this crew
  const releases = await prisma.$queryRawUnsafe<ReleaseRow[]>(`
    SELECT
      cc.colly_id,
      c.filename,
      c.name,
      c.year
    FROM collys_crews cc
    JOIN collys c ON c.id = cc.colly_id
    WHERE cc.crew_id = ${crew.id}
    ORDER BY c.filename ASC
  `);

  return (
    <SiteLayout title="CREW iNFO">
      <div className="row apb-1">
        <div className="header col-lg-12">
          <h2 className="ap-1 bg-header">{crew.name}</h2>
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
              ? <a href={`/artist/${m.artisturl}`}>{m.nick}</a>
              : <span>{m.nick}</span>}
            {m.user_nickurl && (
              <a className="lightgrey" href={`/member/${m.user_nickurl}`}>[profile]</a>
            )}
          </div>
        ))
      ) : (
        <div className="col-lg-12 pl-0 lightgrey">No members listed.</div>
      )}

      {/* Releases */}
      <div className="row apt-1 apb-1">
        <h2 className="bg-header">Releases</h2>
      </div>
      {releases.length > 0 ? (
        releases.map((r) => (
          <div key={r.colly_id} className="col-lg-12 d-flex justify-content-between pl-0">
            <div className="col-lg-6 pl-0">
              <a className="magenta" href={`/release/${r.filename}`}>
                {r.filename}
              </a>
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
    </SiteLayout>
  );
}
