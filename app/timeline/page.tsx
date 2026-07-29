import ContentLink from "@/components/ui/ContentLink";
import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

export const dynamic = "force-dynamic";

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const BAR_WIDTH = 40;

async function yearCounts() {
  const rows = await prisma.$queryRaw<{ year: number; n: bigint }[]>(Prisma.sql`
    SELECT year, COUNT(*) AS n
    FROM collys
    WHERE year IS NOT NULL AND year > 1980 AND year < 2100
    GROUP BY year
    ORDER BY year ASC
  `);
  return rows.map((r) => ({ year: r.year, n: Number(r.n) }));
}

async function collysForYear(year: number) {
  return prisma.$queryRaw<{ filename: string; name: string | null; month: number | null; day: number | null }[]>(Prisma.sql`
    SELECT filename, name, month, day
    FROM collys
    WHERE year = ${year}
    ORDER BY month ASC, day ASC, filename ASC
  `);
}

export default async function TimelinePage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { year: yearParam } = await searchParams;
  const year = Number(yearParam);
  const hasYear = Number.isFinite(year) && year > 1980 && year < 2100;

  if (hasYear) {
    const collys = await collysForYear(year);
    return (
      <SiteLayout title={`TIMELINE ${year}`}>
        <div className="col-12 amb-1">
          <ContentLink href="/timeline" className="magenta">&larr; all years</ContentLink>
          <span className="lightgrey apl-1">{collys.length} release{collys.length !== 1 ? "s" : ""} in {year}</span>
        </div>
        {collys.map((c) => (
          <div key={c.filename} className="row amb-1">
            <div className="col-12">
              <span className="lightgrey" style={{ display: "inline-block", width: "64px" }}>
                {c.month ? MONTHS[c.month] : ""}{c.day ? ` ${c.day}` : ""}
              </span>
              <ContentLink className="magenta" href={`/release/${c.filename}`}>{c.name ?? c.filename}</ContentLink>
              <span className="lightgrey apl-1">{c.filename}</span>
            </div>
          </div>
        ))}
      </SiteLayout>
    );
  }

  const years = await yearCounts();
  const max = years.reduce((m, y) => Math.max(m, y.n), 1);

  return (
    <SiteLayout title="TIMELINE">
      <div className="col-12 lightgrey amb-1">Releases per year — pick a year to browse it.</div>
      <pre
        style={{
          fontFamily: "TopazPlus_a1200, monospace",
          fontSize: "16px",
          lineHeight: "1.2",
          whiteSpace: "pre",
          margin: 0,
        }}
      >
        {years.map((y) => {
          const bars = Math.max(1, Math.round((y.n / max) * BAR_WIDTH));
          return (
            <span key={y.year} style={{ display: "block" }}>
              <ContentLink href={`/timeline?year=${y.year}`} className="magenta">{y.year}</ContentLink>
              <span className="green">{"  " + "█".repeat(bars)}</span>
              <span className="lightgrey">{"  " + y.n}</span>
            </span>
          );
        })}
      </pre>
    </SiteLayout>
  );
}
