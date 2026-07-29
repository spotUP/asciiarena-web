import SiteLayout from "@/components/layout/SiteLayout";
import SearchForm from "@/components/layout/SearchForm";
import ContentLink from "@/components/ui/ContentLink";
import { prisma } from "@/lib/db";
import { searchLogos } from "@/lib/collyLogoSearch";
import { searchCollyContent } from "@/lib/collyContentSearch";
import { parseSearchQuery } from "@/lib/searchQuery";

const MIN = 2;
const ok = (t: string | null | undefined): t is string => !!t && t.trim().length >= MIN;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const p = parseSearchQuery(query);

  // A category runs with its own scoped term, or — when the query is unscoped —
  // with the free text (so a bare query still searches everything).
  const free = p.isScoped ? null : p.free;
  const nameT = p.name ?? free;
  const artistT = p.artist ?? free;
  const crewT = p.crew ?? free;
  const memberT = p.member ?? free;
  const logoT = p.logo ?? free;
  const contentT = p.content ?? free;

  const [collysByName, collysByArtist, collysByCrew, artists, crews, members, logoHits, contentHits] = await Promise.all([
    ok(nameT)
      ? prisma.collys.findMany({
          where: { OR: [{ name: { contains: nameT } }, { filename: { contains: nameT } }] },
          select: { filename: true, name: true },
          take: 20,
          orderBy: { name: "asc" },
        })
      : [],
    ok(artistT)
      ? prisma.artists_collys.findMany({
          where: { artists: { nick: { contains: artistT } } },
          select: { collys: { select: { filename: true, name: true } } },
          take: 20,
          orderBy: { colly_id: "desc" },
        })
      : [],
    ok(crewT)
      ? prisma.collys_crews.findMany({
          where: { crews: { name: { contains: crewT } } },
          select: { collys: { select: { filename: true, name: true } } },
          take: 20,
          orderBy: { colly_id: "desc" },
        })
      : [],
    ok(artistT)
      ? prisma.artists.findMany({ where: { nick: { contains: artistT } }, select: { nick: true, artisturl: true }, take: 10, orderBy: { nick: "asc" } })
      : [],
    ok(crewT)
      ? prisma.crews.findMany({ where: { name: { contains: crewT } }, select: { name: true, crewurl: true }, take: 10, orderBy: { name: "asc" } })
      : [],
    ok(memberT)
      ? prisma.users.findMany({ where: { nick: { contains: memberT } }, select: { nick: true, nickurl: true }, take: 10, orderBy: { nick: "asc" } })
      : [],
    ok(logoT) ? searchLogos(logoT) : Promise.resolve([]),
    ok(contentT) ? searchCollyContent(contentT) : Promise.resolve([]),
  ]);

  // Merge colly results (name + by-artist + by-crew), deduplicate by filename.
  const seen = new Set<string>();
  const allCollys: { filename: string; name: string | null }[] = [];
  const pushColly = (c: { filename: string; name: string | null } | null | undefined) => {
    if (c && !seen.has(c.filename)) { seen.add(c.filename); allCollys.push(c); }
  };
  collysByName.forEach(pushColly);
  collysByArtist.forEach((r) => pushColly(r.collys));
  collysByCrew.forEach((r) => pushColly(r.collys));
  const collys = allCollys.slice(0, 30);

  const total = collys.length + artists.length + crews.length + members.length + logoHits.length + contentHits.length;

  return (
    <SiteLayout title="SEARCH">
      <SearchForm initial={query} />

      {query.length >= MIN && (
        <div className="col-12 lightgrey amb-1">
          {total === 0 ? "No results." : `${total} result${total !== 1 ? "s" : ""} for "${query}"`}
          <span className="apl-1" style={{ opacity: 0.6 }}>scope with artist: crew: member: content: logo:</span>
        </div>
      )}

      {collys.length > 0 && (
        <>
          <h2 className="bg-header ap-1 amb-1">Releases</h2>
          {collys.map((c) => (
            <div key={c.filename} className="row amb-1">
              <div className="col-12">
                <ContentLink className="magenta" href={`/release/${c.filename}`}>{c.name ?? c.filename}</ContentLink>
                <span className="lightgrey apl-1">{c.filename}</span>
              </div>
            </div>
          ))}
        </>
      )}

      {contentHits.length > 0 && (
        <>
          <h2 className="bg-header ap-1 amb-1 apt-1">Content matches</h2>
          {contentHits.map((h) => (
            <div key={h.filename} className="row amb-1">
              <div className="col-12">
                <ContentLink className="magenta" href={`/release/${h.filename}`}>{h.name ?? h.filename}</ContentLink>
                {h.snippet && <div className="lightgrey" style={{ fontSize: "0.85em" }}>{h.snippet}</div>}
              </div>
            </div>
          ))}
        </>
      )}

      {logoHits.length > 0 && (
        <>
          <h2 className="bg-header ap-1 amb-1 apt-1">Logos in collys</h2>
          {logoHits.map((h) => (
            <div key={h.filename} className="row amb-1">
              <div className="col-12">
                <ContentLink className="magenta" href={`/release/${h.filename}#logo-${h.start_line}`}>{h.name ?? h.filename}</ContentLink>
                {h.labels.length > 0 && (
                  <div className="lightgrey" style={{ fontSize: "0.85em" }}>{h.labels.join("  ·  ")}</div>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {artists.length > 0 && (
        <>
          <h2 className="bg-header ap-1 amb-1 apt-1">Artists</h2>
          {artists.map((a) => (
            <div key={a.artisturl} className="row amb-1">
              <div className="col-12"><ContentLink className="magenta" href={`/artist/${a.artisturl}`}>{a.nick}</ContentLink></div>
            </div>
          ))}
        </>
      )}

      {crews.length > 0 && (
        <>
          <h2 className="bg-header ap-1 amb-1 apt-1">Crews</h2>
          {crews.map((c) => (
            <div key={c.crewurl} className="row amb-1">
              <div className="col-12"><ContentLink className="magenta" href={`/crew/${c.crewurl}`}>{c.name}</ContentLink></div>
            </div>
          ))}
        </>
      )}

      {members.length > 0 && (
        <>
          <h2 className="bg-header ap-1 amb-1 apt-1">Members</h2>
          {members.map((m) => (
            <div key={m.nickurl} className="row amb-1">
              <div className="col-12"><ContentLink className="magenta" href={`/member/${m.nickurl}`}>{m.nick}</ContentLink></div>
            </div>
          ))}
        </>
      )}
    </SiteLayout>
  );
}
