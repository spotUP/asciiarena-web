import ContentLink from "@/components/ui/ContentLink";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { countrySlug } from "@/lib/countrySlug";
import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";
import WatchingPip from "@/components/widgets/WatchingPip";
import { getSession as auth } from "@/lib/session";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const id = Number((await params).id);
  const bbs = await prisma.bbses.findUnique({ where: { id }, select: { name: true, sysop: true } });
  if (!bbs) return {};
  return {
    title: `${bbs.name} | aSCIIaRENA BBS`,
    description: bbs.sysop ? `BBS operated by ${bbs.sysop}.` : `${bbs.name} BBS listing on aSCIIaRENA.`,
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BbsPage({ params }: PageProps) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const bbs = await prisma.bbses.findUnique({ where: { id } });
  if (!bbs) notFound();

  const affiliatedCrews = await prisma.$queryRaw<{ crew: string; crewurl: string | null }[]>`
    SELECT bo.crew, c.crewurl
    FROM bbs_of bo
    LEFT JOIN crews c ON LOWER(c.name) = LOWER(bo.crew)
    WHERE bo.name = ${bbs.name}
    ORDER BY bo.crew ASC
  `;

  // Text ads are members-only (Demozoo hosts them login-walled; this mirror
  // respects the boundary). The page stays public; only this section hides.
  // Table may not exist yet on instances that never ran the import migration.
  const session = await auth();
  let adCount = 0;
  let recentAds: { id: number; filename: string | null }[] = [];
  if (session?.user) {
    try {
      const countRows = await prisma.$queryRaw<{ cnt: bigint | number }[]>`
        SELECT COUNT(*) AS cnt FROM bbs_ads WHERE bbs_id = ${id}
      `;
      adCount = Number(countRows[0]?.cnt ?? 0);
      if (adCount > 0) {
        recentAds = await prisma.$queryRaw<{ id: number; filename: string | null }[]>`
          SELECT id, filename FROM bbs_ads WHERE bbs_id = ${id} ORDER BY id ASC LIMIT 12
        `;
      }
    } catch {
      adCount = 0;
    }
  }

  return (
    <SiteLayout title="BBS iNFO">
      <div className="row apb-1">
        <div className="header col-lg-12">
          <h2 className="ap-1 bg-header">
            {bbs.name}
            <WatchingPip channel={`viewing:bbs:${bbs.id}`} />
          </h2>
        </div>
      </div>

      <div className="col-lg-12 pl-0">
        <span className="lightgrey">Name: </span>
        {bbs.name}
      </div>
      {bbs.sysop && (
        <div className="col-lg-12 pl-0">
          <span className="lightgrey">Sysop: </span>
          {bbs.sysop}
        </div>
      )}
      {bbs.address && (
        <div className="col-lg-12 pl-0">
          <span className="lightgrey">Address: </span>
          {bbs.address}
        </div>
      )}
      {bbs.number && (
        <div className="col-lg-12 pl-0">
          <span className="lightgrey">Number: </span>
          {bbs.number}
        </div>
      )}
      {bbs.country && (
        <div className="col-lg-12 pl-0">
          <span className="lightgrey">Country: </span>
          <ContentLink href={`/country/${countrySlug(bbs.country)}`}>{bbs.country}</ContentLink>
        </div>
      )}
      {bbs.software && (
        <div className="col-lg-12 pl-0">
          <span className="lightgrey">Software: </span>
          {bbs.software}
        </div>
      )}
      <div className="col-lg-12 pl-0">
        <span className="lightgrey">Status: </span>
        {bbs.online ? "Online" : "Offline"}
      </div>

      {affiliatedCrews.length > 0 && (
        <>
          <div className="row apt-1 apb-1">
            <h2 className="bg-header">Affiliated Groups</h2>
          </div>
          {affiliatedCrews.map((c) => (
            <div key={c.crew} className="col-lg-12 pl-0">
              {c.crewurl
                ? <a href={`/crew/${c.crewurl}`}>{c.crew}</a>
                : <a href={`/crew/${urlsafe(c.crew)}`}>{c.crew}</a>}
            </div>
          ))}
        </>
      )}

      {session?.user && adCount > 0 && (
        <>
          <div className="row apt-1 apb-1">
            <h2 className="bg-header">Text Ads ({adCount})</h2>
          </div>
          {recentAds.map((a) => (
            <div key={a.id} className="col-lg-12 pl-0">
              <ContentLink href={`/ads/${a.id}`}>{a.filename}</ContentLink>
            </div>
          ))}
          {adCount > recentAds.length && (
            <div className="col-lg-12 pl-0">
              <ContentLink href={`/ads?bbs_id=${bbs.id}`}>All {adCount} ads...</ContentLink>
            </div>
          )}
        </>
      )}
    </SiteLayout>
  );
}
