import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import SiteLayout from "@/components/layout/SiteLayout";
import { Prisma } from "@/lib/generated/prisma/client";
import { countrySlug, matchCountryValues, displayCountryName } from "@/lib/countrySlug";
import { urlsafe } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ArtistRow { nick: string; artisturl: string; active: string | null; collys: bigint | number }
interface BbsRow { id: number; name: string | null; sysop: string | null; online: boolean }
interface MemberRow { nick: string }

// Everyone and everything recorded as being from one country. The slug can
// correspond to several raw spellings (the column is free text), so each query
// matches the whole set.
export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const wanted = countrySlug(decodeURIComponent(slug));
  if (!wanted) notFound();

  const distinct = await prisma.$queryRaw<Array<{ country: string | null }>>`
    SELECT DISTINCT country FROM artists WHERE country IS NOT NULL AND TRIM(country) <> ''
    UNION SELECT DISTINCT country FROM bbses WHERE country IS NOT NULL AND TRIM(country) <> ''
    UNION SELECT DISTINCT country FROM users WHERE country IS NOT NULL AND TRIM(country) <> ''
  `;
  const values = matchCountryValues(wanted, distinct.map(r => r.country));
  if (values.length === 0) notFound();

  const name = displayCountryName(values);
  const inCountry = Prisma.sql`IN (${Prisma.join(values)})`;

  const [artists, bbses, members] = await Promise.all([
    prisma.$queryRaw<ArtistRow[]>`
      SELECT a.nick, a.artisturl, a.active,
        (SELECT COUNT(*) FROM artists_collys ac WHERE ac.artist_id = a.id) AS collys
      FROM artists a
      WHERE a.country ${inCountry}
      ORDER BY collys DESC, a.nick ASC
    `,
    prisma.$queryRaw<BbsRow[]>`
      SELECT id, name, sysop, online FROM bbses WHERE country ${inCountry} ORDER BY online DESC, name ASC
    `,
    prisma.$queryRaw<MemberRow[]>`
      SELECT nick FROM users WHERE country ${inCountry} AND nick IS NOT NULL ORDER BY nick ASC
    `,
  ]);

  const row = { gap: "16px", height: "16px", lineHeight: "16px", marginBottom: "8px" } as const;

  return (
    <SiteLayout title={name.toUpperCase()}>
      <div className="container-fluid bg-secondary apb-1 ap-1" style={{ marginBottom: "16px" }}>
        <div className="header col-12 bg-header ap-1 amb-1">
          <span className="yellow">ARTISTS</span>
          <span className="lightgrey" style={{ marginLeft: "16px" }}>{artists.length}</span>
        </div>
        {artists.length === 0 && <div className="lightgrey">No artists recorded from {name}.</div>}
        {artists.map(a => (
          <div key={a.artisturl} className="col-lg-12 p-0 d-flex" style={row}>
            <Link href={`/artist/${a.artisturl}`} className="magenta" style={{ minWidth: "240px", fontFamily: "TopazPlus_a1200, monospace" }}>
              {a.nick}
            </Link>
            <span className="lightgrey" style={{ minWidth: "144px" }}>{Number(a.collys)} collys</span>
            <span className="lightgrey" style={{ minWidth: "144px" }}>{a.active || ""}</span>
          </div>
        ))}
      </div>

      {bbses.length > 0 && (
        <div className="container-fluid bg-secondary apb-1 ap-1" style={{ marginBottom: "16px" }}>
          <div className="header col-12 bg-header ap-1 amb-1">
            <span className="yellow">BOARDS</span>
            <span className="lightgrey" style={{ marginLeft: "16px" }}>{bbses.length}</span>
          </div>
          {bbses.map(b => (
            <div key={b.id} className="col-lg-12 p-0 d-flex" style={row}>
              <Link href={`/bbs/${b.id}`} className="magenta" style={{ minWidth: "240px", fontFamily: "TopazPlus_a1200, monospace" }}>
                {b.name || "(unnamed)"}
              </Link>
              <span className="lightgrey" style={{ minWidth: "144px" }}>{b.sysop || ""}</span>
              <span className={b.online ? "lightgreen" : "lightgrey"} style={{ minWidth: "96px" }}>
                {b.online ? "online" : "offline"}
              </span>
            </div>
          ))}
        </div>
      )}

      {members.length > 0 && (
        <div className="container-fluid bg-secondary apb-1 ap-1" style={{ marginBottom: "16px" }}>
          <div className="header col-12 bg-header ap-1 amb-1">
            <span className="yellow">MEMBERS</span>
            <span className="lightgrey" style={{ marginLeft: "16px" }}>{members.length}</span>
          </div>
          {members.map(m => (
            <div key={m.nick} className="col-lg-12 p-0 d-flex" style={row}>
              <Link href={`/member/${urlsafe(m.nick)}`} className="magenta" style={{ fontFamily: "TopazPlus_a1200, monospace" }}>
                {m.nick}
              </Link>
            </div>
          ))}
        </div>
      )}

      <div>
        <Link href="/countries" className="lightgrey" style={{ fontFamily: "TopazPlus_a1200, monospace" }}>
          {"[ all countries -> ]"}
        </Link>
      </div>
    </SiteLayout>
  );
}
