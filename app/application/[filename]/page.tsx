import { readFileSync, existsSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { formatBytes } from "@/lib/utils";

interface PageProps {
  params: Promise<{ filename: string }>;
}

function encodeFileText(filePath: string): string {
  const buf = readFileSync(filePath);
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    text = Array.from(buf as Uint8Array).map(b => String.fromCharCode(b)).join("");
  }
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatDate(year: number, month: number, day: number): string {
  if (!year) return "-";
  const parts = [String(year)];
  if (month) parts.push(String(month).padStart(2, "0"));
  if (day) parts.push(String(day).padStart(2, "0"));
  return parts.join("-");
}

function formatTimestamp(ts: number | null): string {
  if (!ts) return "-";
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { filename: raw } = await params;
  const filename = raw.replace(/\.\./g, "").replace(/[/\\]/g, "");
  const app = await prisma.apps.findFirst({ where: { filename } });
  if (!app) return {};
  return {
    title: `${app.name ?? filename} | aSCIIaRENA`,
    description: `ASCII application: ${app.name ?? filename} by ${app.author ?? "unknown"}`,
  };
}

export default async function ApplicationPage({ params }: PageProps) {
  const { filename: raw } = await params;
  const filename = raw.replace(/\.\./g, "").replace(/[/\\]/g, "");

  const app = await prisma.apps.findFirst({ where: { filename } });
  if (!app) notFound();

  const uploader = app.uploader_id
    ? await prisma.users.findUnique({ where: { id: app.uploader_id }, select: { nick: true, nickurl: true } })
    : null;

  const appsPath = process.env.APPS_PATH ?? path.join(process.cwd(), "apps");
  const dizPath = path.join(appsPath, `${filename}.diz`);
  const dizContent = existsSync(dizPath) ? encodeFileText(dizPath) : "";

  const downloadUrl = `/apps/${filename}`;

  return (
    <SiteLayout title="ASCII APP">
      <div className="row apb-1">
        <div className="header col-lg-12">
          <h2 className="ap-1 bg-header">{app.name ?? filename}</h2>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          {dizContent ? (
            <pre style={{ fontFamily: "TopazPlus_a1200, monospace", color: "#ff55ff", whiteSpace: "pre", overflowX: "auto" }}
              dangerouslySetInnerHTML={{ __html: dizContent }} />
          ) : (
            <div className="lightgrey">No description available.</div>
          )}

          <div className="row apt-1">
            <div className="col-12">
              <a href={downloadUrl}>
                <input type="button" className="btn-big" value="Download" readOnly />
              </a>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="col-lg-12 pl-0"><span className="lightgrey">Filename: </span>{filename}</div>
          <div className="col-lg-12 pl-0"><span className="lightgrey">Size: </span>{formatBytes(app.filesize ?? 0)}</div>
          <div className="col-lg-12 pl-0"><span className="lightgrey">Released: </span>{formatDate(app.year, app.month, app.day)}</div>
          <div className="col-lg-12 pl-0"><span className="lightgrey">Author: </span>{app.author ?? "-"}</div>
          <div className="col-lg-12 pl-0"><span className="lightgrey">Downloads: </span>{app.downloads ?? 0}</div>
          <div className="col-lg-12 pl-0">
            <span className="lightgrey">Uploaded by: </span>
            {uploader
              ? <a href={`/member/${uploader.nickurl}`}>{uploader.nick}</a>
              : <span>{app.uploader ?? "-"}</span>}
          </div>
          <div className="col-lg-12 pl-0"><span className="lightgrey">Upload date: </span>{formatTimestamp(app.timestamp ?? null)}</div>
        </div>
      </div>
    </SiteLayout>
  );
}
