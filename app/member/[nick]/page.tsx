import Link from "next/link";
import type { Metadata } from "next";
import SiteLayout from "@/components/layout/SiteLayout";
import UnfaveButton from "./UnfaveButton";
import ChatButton from "./ChatButton";
import OnlineDot from "@/components/ui/OnlineDot";
import LiveRefresh from "@/components/widgets/LiveRefresh";
import { prisma } from "@/lib/db";
import { getSession as auth } from "@/lib/session";
import { decodeParam } from "@/lib/utils";
import { notFound } from "next/navigation";

interface MemberRow {
  id: number;
  nick: string | null;
  crew: string | null;
  country: string | null;
  rank: string | null;
  joined: number | bigint | null;
  uploaded: number | null;
  mail: string | null;
  display_mail: number | null;
}

interface ArtistRow {
  id: number;
  nick: string | null;
  artisturl: string | null;
}

interface CommentRow {
  comment: string | null;
  filename: string | null;
}

interface CrewMembershipRow {
  crew: string;
  crewurl: string | null;
  artist_nick: string;
  artisturl: string;
}

interface CollyRow {
  name: string | null;
  filename: string | null;
  artists: string | null;
  crews: string | null;
}

interface FaveRow {
  colly_id: number;
  name: string | null;
  filename: string | null;
  artists: string | null;
  crews: string | null;
}

function formatJoined(ts: number | bigint | string | null): string {
  if (ts == null || ts === "") return "Unknown";
  // joined is legacy: sometimes a unix-timestamp string, sometimes "YYYY-MM-DD".
  const raw = String(ts);
  const d = /^\d+$/.test(raw) ? new Date(Number(raw) * 1000) : new Date(raw);
  return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : "Unknown";
}

export async function generateMetadata({ params }: { params: Promise<{ nick: string }> }): Promise<Metadata> {
  const { nick: rawNick } = await params;
  const nick = decodeParam(rawNick);
  const rows = await prisma.$queryRaw<{ nick: string }[]>`SELECT nick FROM users WHERE nickurl = ${nick} LIMIT 1`;
  if (!rows[0]) return {};
  return {
    title: `${rows[0].nick} | aSCIIaRENA`,
    description: `aSCIIaRENA member profile for ${rows[0].nick}.`,
  };
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ nick: string }>;
}) {
  const { nick: rawNick } = await params;
  const nick = decodeParam(rawNick);

  const [session, members] = await Promise.all([
    auth(),
    prisma.$queryRaw<MemberRow[]>`
      SELECT id, nick, crew, country, \`rank\`, joined, uploaded, mail, display_mail
      FROM users WHERE nickurl = ${nick} LIMIT 1
    `,
  ]);
  const member = members[0];
  if (!member) notFound();

  const [artists, comments, commentCount, collys, faves] = await Promise.all([
    prisma.$queryRaw<ArtistRow[]>`
      SELECT id, nick, artisturl
      FROM artists
      WHERE user_id = ${member.id}
      ORDER BY nick ASC
    `,
    prisma.$queryRaw<CommentRow[]>`
      SELECT comment, filename
      FROM comments
      WHERE user_id = ${member.id}
      ORDER BY timestamp DESC
      LIMIT 10
    `,
    prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COUNT(*) AS total FROM comments WHERE user_id = ${member.id}
    `,
    prisma.$queryRaw<CollyRow[]>`
      SELECT c.name, c.filename,
             GROUP_CONCAT(DISTINCT a.nick) AS artists,
             GROUP_CONCAT(DISTINCT w.name) AS crews
      FROM collys c
      LEFT JOIN artists_collys ac ON c.id = ac.colly_id
      LEFT JOIN artists a ON ac.artist_id = a.id
      LEFT JOIN collys_crews cc ON c.id = cc.colly_id
      LEFT JOIN crews w ON w.id = cc.crew_id
      WHERE c.uploader_id = ${member.id}
      GROUP BY c.filename
      ORDER BY MAX(c.timestamp) DESC
      LIMIT 10
    `,
    prisma.$queryRaw<FaveRow[]>`
      SELECT f.colly_id, c.filename, c.name,
             GROUP_CONCAT(DISTINCT a.nick) AS artists,
             GROUP_CONCAT(DISTINCT w.name) AS crews
      FROM favourites f
      LEFT JOIN collys c ON f.colly_id = c.id
      LEFT JOIN collys_crews cc ON f.colly_id = cc.colly_id
      LEFT JOIN crews w ON cc.crew_id = w.id
      LEFT JOIN artists_collys ac ON f.colly_id = ac.colly_id
      LEFT JOIN artists a ON a.id = ac.artist_id
      WHERE f.user_id = ${member.id}
      GROUP BY f.colly_id, c.filename
    `,
  ]);

  const totalComments = Number(commentCount[0]?.total ?? 0);

  // Crew memberships via linked artist handles
  const crewMemberships = artists.length > 0
    ? await prisma.$queryRaw<CrewMembershipRow[]>`
        SELECT mo.crew, w.crewurl, a.nick AS artist_nick, a.artisturl
        FROM member_of mo
        JOIN artists a ON LOWER(a.nick) = LOWER(mo.nick)
        LEFT JOIN crews w ON LOWER(w.name) = LOWER(mo.crew)
        WHERE a.user_id = ${member.id}
        ORDER BY mo.crew ASC, mo.nick ASC
      `
    : [];

  const kb = Math.round((member.uploaded ?? 0) / 1000);
  const isOwnProfile = session?.user?.id ? Number(session.user.id) === member.id : false;
  const isAdmin = member.rank === "Admin";
  const isPumper = (member.uploaded ?? 0) >= 20_000_000;
  const isSupporter = totalComments >= 300;

  return (
    <SiteLayout title="MEMBER">
      <LiveRefresh channel={`user:${member.id}:profile`} />
      <div className="container-fluid apb-1">
        <div className="row align-items-center">
          <div className="col-sm-4">
            <span className="white">Nick: </span>
            <span className="yellow">{member.nick}</span>
            <OnlineDot nick={member.nick ?? ""} />
          </div>
          <div className="col-sm-4">
            <span className="white">Status: </span>
            <span className="yellow">{member.rank}</span>
          </div>
          <div className="col-sm-4" style={{ display: "flex", gap: "4px" }}>
            {isAdmin && <img src="/assets/data/sticker_king.png" alt="Admin" title="Admin" style={{ height: "24px" }} />}
            {isPumper && <img src="/assets/data/sticker_pumper.png" alt="Pumper" title="Top Uploader" style={{ height: "24px" }} />}
            {isSupporter && <img src="/assets/data/sticker_supporter.png" alt="Supporter" title="Active Commenter" style={{ height: "24px" }} />}
          </div>
        </div>

        {(member.crew || member.country) && (
          <div className="row">
            {member.crew && (
              <div className="col-sm-4">
                <span className="white">Crew: </span>
                <span className="yellow">{member.crew}</span>
              </div>
            )}
            {member.country && (
              <div className="col-sm-8">
                <span className="white">Country: </span>
                <span className="yellow">{member.country}</span>
              </div>
            )}
          </div>
        )}

        <div className="row apt-1">
          <div className="col-sm-4">
            <span className="white">Member since: </span>
            <span className="yellow">{formatJoined(member.joined)}</span>
          </div>
        </div>

        {artists.length > 0 && (
          <div className="row apt-1">
            <div className="col-sm-12">
              <span className="white">Artist handle{artists.length > 1 ? "s" : ""}: </span>
              {artists.map((a, i) => (
                <span key={a.id}>
                  {i > 0 && ", "}
                  <Link className="magenta" href={`/artist/${a.artisturl}`}>{a.nick}</Link>
                </span>
              ))}
            </div>
          </div>
        )}
        {crewMemberships.length > 0 && (
          <div className="row apt-1">
            <div className="col-sm-12">
              <span className="white">Scene crews: </span>
              {Array.from(new Set(crewMemberships.map(m => m.crew))).map((crewName, i) => {
                const m = crewMemberships.find(x => x.crew === crewName)!;
                return (
                  <span key={crewName}>
                    {i > 0 && ", "}
                    {m.crewurl
                      ? <Link href={`/crew/${m.crewurl}`}>{crewName}</Link>
                      : <span>{crewName}</span>}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {collys.length > 0 && kb > 0 && (
          <div className="row apt-1">
            <div className="col-12">
              {member.nick} has pumped up {collys.length} collys ({kb} kB)
              {totalComments > 0 && ` and commented ${totalComments} collys`}.
            </div>
          </div>
        )}

        {Number(member.display_mail) === 1 && member.mail && (
          <div className="row apt-1">
            <div className="col-sm-12">
              <span className="white">Email: </span>
              <a href={`mailto:${member.mail}`}>{member.mail}</a>
            </div>
          </div>
        )}

        {session?.user && !isOwnProfile && (
          <div className="row apt-1">
            <ChatButton peerId={member.id} peerNick={member.nick ?? ""} />
          </div>
        )}

        {totalComments > 0 && (
          <>
            <div className="row apt-1">
              <div className="col-12 apb-1">
                <h2 className="ap-1 bg-header">Last 10 comments by {member.nick}</h2>
              </div>
            </div>
            {comments.map((c, i) => (
              <div key={i} className="row">
                <div className="col-sm-10 amb-1 cyan">{c.comment}</div>
                <div className="col-sm-2 amb-1 text-truncate">
                  <Link className="magenta" href={`/release/${c.filename}`}>
                    {c.filename}
                  </Link>
                </div>
              </div>
            ))}
          </>
        )}

        {collys.length > 0 && (
          <>
            <div className="row apt-1">
              <div className="col-12 apb-1">
                <h2 className="ap-1 bg-header">Last 10 collys added by {member.nick}</h2>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-4 apb-1 d-none d-sm-block">
                <span className="white">NAME</span>
              </div>
              <div className="col-sm-4 apb-1 d-none d-sm-block">
                <span className="white">ARTiST</span>
              </div>
              <div className="col-sm-4 apb-1 d-none d-sm-block">
                <span className="white">CREW</span>
              </div>
            </div>
            {collys.map((c, i) => (
              <div key={i} className="row">
                <div className="col-12 col-sm-4 text-truncate">
                  <Link className="magenta" href={`/release/${c.filename}`}>
                    {c.name}
                  </Link>
                </div>
                <div className="col-12 d-block d-sm-none text-truncate apb-1">
                  by {c.artists ?? "-"} of {c.crews ?? "-"}
                </div>
                <div className="col-4 col-sm-4 text-truncate d-none d-sm-block">
                  {c.artists ?? "-"}
                </div>
                <div className="col-sm-4 text-truncate d-none d-sm-block">
                  {c.crews ?? "-"}
                </div>
              </div>
            ))}
          </>
        )}

        {faves.length > 0 && (
          <>
            <div className="row apt-1 apb-1">
              <div className="col-12">
                <h2 className="ap-1 bg-header">{member.nick}&apos;s Favourites</h2>
              </div>
            </div>
            <div className="row apb-1">
              <div className={`${isOwnProfile ? "col-sm-3" : "col-sm-4"} apb-1 d-none d-sm-block`}>
                <span className="white">NAME</span>
              </div>
              <div className="col-sm-4 apb-1 d-none d-sm-block">
                <span className="white">ARTiST</span>
              </div>
              <div className="col-sm-4 apb-1 d-none d-sm-block">
                <span className="white">CREW</span>
              </div>
            </div>
            {faves.map((f, i) => (
              <div key={i} className="row amb-1">
                <div className={`col-12 ${isOwnProfile ? "col-sm-3" : "col-sm-4"}`}>
                  <Link className="magenta" href={`/release/${f.filename}`}>
                    {f.name}
                  </Link>
                </div>
                <div className="col-sm-4 d-none d-sm-block">{f.artists ?? "-"}</div>
                <div className="col-sm-4 d-none d-sm-block">{f.crews ?? "-"}</div>
                <div className="col-12 apb-1 d-block d-sm-none">
                  by {f.artists ?? "-"} of {f.crews ?? "-"}
                </div>
                {isOwnProfile && (
                  <div className="col-12 col-sm-1">
                    <UnfaveButton collyId={f.colly_id} />
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

    </SiteLayout>
  );
}
