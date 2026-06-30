import SiteLayout from "@/components/layout/SiteLayout";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { searchLogos } from "@/lib/collyLogoSearch";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const [collys, collysByArtist, artists, crews, members, logoHits] = query.length >= 2 ? await Promise.all([
    // Collys by name/filename
    prisma.collys.findMany({
      where: { OR: [{ name: { contains: query } }, { filename: { contains: query } }] },
      select: { filename: true, name: true },
      take: 20,
      orderBy: { name: "asc" },
    }),
    // Collys by artist name — find artists matching query, then get their collys
    prisma.artists_collys.findMany({
      where: { artists: { nick: { contains: query } } },
      select: { collys: { select: { filename: true, name: true } } },
      take: 20,
      orderBy: { colly_id: "desc" },
    }),
    // Artists by nick
    prisma.artists.findMany({
      where: { nick: { contains: query } },
      select: { nick: true, artisturl: true },
      take: 10,
      orderBy: { nick: "asc" },
    }),
    // Crews by name
    prisma.crews.findMany({
      where: { name: { contains: query } },
      select: { name: true, crewurl: true },
      take: 10,
      orderBy: { name: "asc" },
    }),
    // Members by nick
    prisma.users.findMany({
      where: { nick: { contains: query } },
      select: { nick: true, nickurl: true },
      take: 10,
      orderBy: { nick: "asc" },
    }),
    // Logos inside collys whose label matches the query
    searchLogos(query),
  ]) : [[], [], [], [], [], []];

  // Merge colly results, deduplicate by filename
  const collyFilenames = new Set(collys.map(c => c.filename));
  const extraCollys = collysByArtist
    .map(r => r.collys)
    .filter(c => c && !collyFilenames.has(c.filename)) as { filename: string; name: string | null }[];
  const allCollys = [...collys, ...extraCollys].slice(0, 30);

  const total = allCollys.length + artists.length + crews.length + members.length + logoHits.length;

  return (
    <SiteLayout title="SEARCH">
      <form method="GET" action="/search" className="row amb-1">
        <div className="col-12 d-flex" style={{ gap: "8px" }}>
          <input name="q" defaultValue={query} className="form-control" placeholder="Search releases, artists, crews..." autoFocus style={{ flex: 1 }} />
          <input type="submit" className="btn-big" value="Search" />
        </div>
      </form>

      {query.length >= 2 && (
        <div className="col-12 lightgrey amb-1">
          {total === 0 ? "No results." : `${total} result${total !== 1 ? "s" : ""} for "${query}"`}
        </div>
      )}

      {allCollys.length > 0 && (
        <>
          <h2 className="bg-header ap-1 amb-1">Releases</h2>
          {allCollys.map(c => (
            <div key={c.filename} className="row amb-1">
              <div className="col-12">
                <Link className="magenta" href={`/release/${c.filename}`}>{c.name ?? c.filename}</Link>
                <span className="lightgrey apl-1">{c.filename}</span>
              </div>
            </div>
          ))}
        </>
      )}

      {logoHits.length > 0 && (
        <>
          <h2 className="bg-header ap-1 amb-1 apt-1">Logos in collys</h2>
          {logoHits.map(h => (
            <div key={h.filename} className="row amb-1">
              <div className="col-12">
                <Link className="magenta" href={`/release/${h.filename}`}>{h.name ?? h.filename}</Link>
                <span className="lightgrey apl-1">{h.labels.slice(0, 4).join(", ")}</span>
              </div>
            </div>
          ))}
        </>
      )}

      {artists.length > 0 && (
        <>
          <h2 className="bg-header ap-1 amb-1 apt-1">Artists</h2>
          {artists.map(a => (
            <div key={a.artisturl} className="row amb-1">
              <div className="col-12"><Link className="magenta" href={`/artist/${a.artisturl}`}>{a.nick}</Link></div>
            </div>
          ))}
        </>
      )}

      {crews.length > 0 && (
        <>
          <h2 className="bg-header ap-1 amb-1 apt-1">Crews</h2>
          {crews.map(c => (
            <div key={c.crewurl} className="row amb-1">
              <div className="col-12"><Link className="magenta" href={`/crew/${c.crewurl}`}>{c.name}</Link></div>
            </div>
          ))}
        </>
      )}

      {members.length > 0 && (
        <>
          <h2 className="bg-header ap-1 amb-1 apt-1">Members</h2>
          {members.map(m => (
            <div key={m.nickurl} className="row amb-1">
              <div className="col-12"><Link className="magenta" href={`/member/${m.nickurl}`}>{m.nick}</Link></div>
            </div>
          ))}
        </>
      )}
    </SiteLayout>
  );
}
