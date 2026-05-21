import SiteLayout from "@/components/layout/SiteLayout";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const [collys, artists, crews] = query.length >= 2 ? await Promise.all([
    prisma.collys.findMany({ where: { OR: [{ name: { contains: query } }, { filename: { contains: query } }] }, select: { filename: true, name: true }, take: 20, orderBy: { name: "asc" } }),
    prisma.artists.findMany({ where: { nick: { contains: query } }, select: { nick: true, artisturl: true }, take: 10, orderBy: { nick: "asc" } }),
    prisma.crews.findMany({ where: { name: { contains: query } }, select: { name: true, crewurl: true }, take: 10, orderBy: { name: "asc" } }),
  ]) : [[], [], []];

  const total = collys.length + artists.length + crews.length;

  return (
    <SiteLayout title="SEARCH">
      <form method="GET" action="/search" className="row amb-1">
        <div className="col-12 d-flex" style={{ gap: "8px" }}>
          <input name="q" defaultValue={query} className="form-control" placeholder="Search releases, artists, crews..." autoFocus style={{ flex: 1 }} />
          <input type="submit" className="btn-big" value="Search" />
        </div>
      </form>

      {query.length >= 2 && (
        <div className="col-12 lightgrey amb-1">{total === 0 ? "No results." : `${total} result${total !== 1 ? "s" : ""} for "${query}"`}</div>
      )}

      {collys.length > 0 && (
        <>
          <h2 className="bg-header ap-1 amb-1">Releases</h2>
          {collys.map(c => (
            <div key={c.filename} className="row amb-1">
              <div className="col-12">
                <Link className="magenta" href={`/release/${c.filename}`}>{c.name ?? c.filename}</Link>
                <span className="lightgrey" style={{ marginLeft: "8px", fontSize: "0.85em" }}>{c.filename}</span>
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
    </SiteLayout>
  );
}
