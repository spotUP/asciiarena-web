import { getSession as auth } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteLayout from "@/components/layout/SiteLayout";
import ContentLink from "@/components/ui/ContentLink";
import AdArt from "@/components/ui/AdArt";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { AD_COLUMNS, parseJsonList, type AdRow } from "@/lib/bbsAdQueries";

interface AdDetail {  id: number;
  bbs_id: number;
  bbs_name: string | null;
  filename: string | null;
  filesize: number | null;
  content: string;
  encoding: string | null;
  is_ansi: number | null;
  phones: string[];
  nodes: number | null;
  handles: string[];
  groups: string[];
  page_url: string | null;
}

// ANSI color codes are stripped inside AdArt; the stored bytes stay
// untouched. React escapes everything rendered inside <pre> by default -
// never use dangerouslySetInnerHTML here.

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: `BBS ad | aSCIIaRENA` };
}

export default async function AdPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const id = Number((await params).id);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const rows = await prisma.$queryRaw<AdRow[]>`
    SELECT ${Prisma.raw(AD_COLUMNS)}
    FROM bbs_ads a JOIN bbses b ON b.id = a.bbs_id
    WHERE a.id = ${id}
  `;
  const found = rows[0];
  if (!found) notFound();
  const ad: AdDetail = {
    ...found,
    id: Number(found.id),
    bbs_id: Number(found.bbs_id),
    filesize: found.filesize == null ? null : Number(found.filesize),
    content: found.content ?? "",
    is_ansi: found.is_ansi ? 1 : 0,
    nodes: found.nodes == null ? null : Number(found.nodes),
    phones: parseJsonList(found.phones),
    handles: parseJsonList(found.handles),
    groups: parseJsonList(found.groups),
  };

  return (
    <SiteLayout title="BBS AD">
      <div className="row apb-1">
        <div className="col-lg-12 pl-0">
          <span className="lightgrey">File: </span>
          {ad.filename}
        </div>
        <div className="col-lg-12 pl-0">
          <span className="lightgrey">BBS: </span>
          <ContentLink href={`/bbs/${ad.bbs_id}`}>{ad.bbs_name}</ContentLink>
        </div>
        {ad.nodes != null && (
          <div className="col-lg-12 pl-0">
            <span className="lightgrey">Nodes: </span>
            {ad.nodes}
          </div>
        )}
        {ad.phones.length > 0 && (
          <div className="col-lg-12 pl-0">
            <span className="lightgrey">Phone: </span>
            {ad.phones.join(", ")}
          </div>
        )}
        {ad.handles.length > 0 && (
          <div className="col-lg-12 pl-0">
            <span className="lightgrey">Handles: </span>
            {ad.handles.join(", ")}
          </div>
        )}
        {ad.groups.length > 0 && (
          <div className="col-lg-12 pl-0">
            <span className="lightgrey">Groups: </span>
            {ad.groups.join(", ")}
          </div>
        )}
        {ad.page_url && (
          <div className="col-lg-12 pl-0">
            <span className="lightgrey">Source: </span>
            <a href={ad.page_url} target="_blank" rel="noreferrer">
              Demozoo
            </a>
          </div>
        )}
      </div>
      <div className="row">
        <div className="col-lg-12">
          <AdArt lines={ad.content.split("\n")} isAnsi={ad.is_ansi} />
        </div>
      </div>
    </SiteLayout>
  );
}
