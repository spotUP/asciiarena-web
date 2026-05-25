import { readFileSync, existsSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { formatBytes } from "@/lib/utils";
import DownloadButton from "@/components/ui/DownloadButton";

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
  const mag = await prisma.mags.findFirst({ where: { filename } });
  if (!mag) return {};
  return {
    title: `${mag.name ?? filename} | aSCIIaRENA`,
    description: `ASCII magazine: ${mag.name ?? filename} by ${mag.author ?? "unknown"}`,
  };
}

export default async function MagazinePage({ params }: PageProps) {
  const { filename: raw } = await params;
  const filename = raw.replace(/\.\./g, "").replace(/[/\\]/g, "");

  const mag = await prisma.mags.findFirst({ where: { filename } });
  if (!mag) notFound();

  const magsPath = process.env.MAGS_PATH ?? path.join(process.cwd(), "mags");
  const dirname = filename.replace(/\.[^.]+$/, "");
  const dizPath = path.join(magsPath, dirname, `${filename}.diz`);
  const dizContent = existsSync(dizPath) ? encodeFileText(dizPath) : "";

  const downloadUrl = `/mags/${dirname}/${filename}`;

  return (
    <SiteLayout title="ASCII MAG">
      <div className="row apb-1">
        <div className="header col-lg-12">
          <h2 className="ap-1 bg-header">{mag.name ?? filename}</h2>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          {dizContent ? (
            <pre className="magenta apt-1" style={{ overflowX: "auto" }}
              dangerouslySetInnerHTML={{ __html: dizContent }} />
          ) : (
            <div className="lightgrey">No description available.</div>
          )}

          <div className="row apt-1">
            <div className="col-12">
              <DownloadButton
                fileUrl={downloadUrl}
                filename={filename}
                apiUrl={`/api/mags/${filename}/download`}
              />
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="col-lg-12 pl-0"><span className="lightgrey">Filename: </span>{filename}</div>
          <div className="col-lg-12 pl-0"><span className="lightgrey">Size: </span>{formatBytes(mag.filesize ?? 0)}</div>
          <div className="col-lg-12 pl-0"><span className="lightgrey">Released: </span>{formatDate(mag.year, mag.month, mag.day)}</div>
          <div className="col-lg-12 pl-0"><span className="lightgrey">Author: </span>{mag.author ?? "-"}</div>
          <div className="col-lg-12 pl-0"><span className="lightgrey">Downloads: </span>{mag.downloads ?? 0}</div>
          <div className="col-lg-12 pl-0"><span className="lightgrey">Uploaded by: </span>{mag.uploader ?? "-"}</div>
          <div className="col-lg-12 pl-0"><span className="lightgrey">Upload date: </span>{formatTimestamp(mag.timestamp ?? null)}</div>
        </div>
      </div>
    </SiteLayout>
  );
}
