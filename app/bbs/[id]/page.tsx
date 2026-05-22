import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { urlsafe } from "@/lib/utils";

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

  return (
    <SiteLayout title="BBS iNFO">
      <div className="row apb-1">
        <div className="header col-lg-12">
          <h2 className="ap-1 bg-header">{bbs.name}</h2>
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
          {bbs.country}
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
    </SiteLayout>
  );
}
