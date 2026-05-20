import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

interface MemberRow {
  id: number;
  nick: string | null;
  crew: string | null;
  country: string | null;
  rank: string | null;
  joined: number | null;
  uploaded: number | null;
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

interface CollyRow {
  name: string | null;
  filename: string | null;
  artists: string | null;
  crews: string | null;
}

interface FaveRow {
  name: string | null;
  filename: string | null;
  artists: string | null;
  crews: string | null;
}

function formatJoined(ts: number | null): string {
  if (!ts) return "Unknown";
  const d = new Date(ts * 1000);
  return d.toISOString().slice(0, 10);
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ nick: string }>;
}) {
  const { nick } = await params;

  const members = await prisma.$queryRaw<MemberRow[]>`
    SELECT id, nick, crew, country, \`rank\`, joined, uploaded
    FROM users
    WHERE nickurl = ${nick}
    LIMIT 1
  `;
  const member = members[0];
  if (!member) notFound();

  const artists = await prisma.$queryRaw<ArtistRow[]>`
    SELECT id, nick, artisturl
    FROM artists
    WHERE user_id = ${member.id}
    LIMIT 1
  `;
  const artist = artists[0] ?? null;

  const comments = await prisma.$queryRaw<CommentRow[]>`
    SELECT comment, filename
    FROM comments
    WHERE user_id = ${member.id}
    ORDER BY timestamp DESC
    LIMIT 10
  `;

  const commentCount = await prisma.$queryRaw<{ total: bigint }[]>`
    SELECT COUNT(*) AS total FROM comments WHERE user_id = ${member.id}
  `;
  const totalComments = Number(commentCount[0]?.total ?? 0);

  const collys = await prisma.$queryRaw<CollyRow[]>`
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
  `;

  const faves = await prisma.$queryRaw<FaveRow[]>`
    SELECT c.filename, c.name,
           GROUP_CONCAT(DISTINCT a.nick) AS artists,
           GROUP_CONCAT(DISTINCT w.name) AS crews
    FROM favourites f
    LEFT JOIN collys c ON f.colly_id = c.id
    LEFT JOIN collys_crews cc ON f.colly_id = cc.colly_id
    LEFT JOIN crews w ON cc.crew_id = w.id
    LEFT JOIN artists_collys ac ON f.colly_id = ac.colly_id
    LEFT JOIN artists a ON a.id = ac.artist_id
    WHERE f.user_id = ${member.id}
    GROUP BY c.filename
  `;

  const kb = Math.round((member.uploaded ?? 0) / 1000);

  return (
    <SiteLayout title="MEMBER">
      <div className="container-fluid apb-1">
        <div className="row">
          <div className="col-sm-4">
            <span className="white">Nick: </span>
            <span className="yellow">{member.nick}</span>
          </div>
          <div className="col-sm-8">
            <span className="white">Status: </span>
            <span className="yellow">{member.rank}</span>
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

        {artist && (
          <div className="row apt-1">
            <div className="col-sm-12">
              <span className="white">Artist profile: </span>
              <a className="magenta" href={`/artist/${artist.artisturl}`}>
                {artist.nick}
              </a>
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

        <div className="row apt-1">
          <a href={`/messages?sendmsg=${member.id}`}>
            <input type="button" className="btn-big" value="Send Message" readOnly />
          </a>
        </div>

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
                  <a className="magenta" href={`/release/${c.filename}`}>
                    {c.filename}
                  </a>
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
                  <a className="magenta" href={`/release/${c.filename}`}>
                    {c.name}
                  </a>
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
            {faves.map((f, i) => (
              <div key={i} className="row">
                <div className="col-12 col-sm-4">
                  <a className="magenta" href={`/release/${f.filename}`}>
                    {f.name}
                  </a>
                </div>
                <div className="col-sm-4 d-none d-sm-block">{f.artists ?? "-"}</div>
                <div className="col-sm-4 d-none d-sm-block">{f.crews ?? "-"}</div>
                <div className="col-12 apb-1 d-block d-sm-none">
                  by {f.artists ?? "-"} of {f.crews ?? "-"}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </SiteLayout>
  );
}
