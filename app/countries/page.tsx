import ContentLink from "@/components/ui/ContentLink";
import { prisma } from "@/lib/db";
import SiteLayout from "@/components/layout/SiteLayout";
import { countrySlug, displayCountryName } from "@/lib/countrySlug";

export const dynamic = "force-dynamic";

interface CountryRow { country: string | null; artists: bigint | number }

// "How many ascii artists were in a particular country" — the whole point of
// the page, so it is ordered by that count rather than alphabetically.
export default async function CountriesPage() {
  const rows = await prisma.$queryRaw<CountryRow[]>`
    SELECT country, COUNT(*) AS artists
    FROM artists
    WHERE country IS NOT NULL AND TRIM(country) <> ''
    GROUP BY country
  `;

  // Fold the spelling variants together — the column is free text, so the same
  // country can be stored several ways and would otherwise split its own count.
  const grouped = new Map<string, { values: string[]; artists: number }>();
  for (const row of rows) {
    if (!row.country) continue;
    const slug = countrySlug(row.country);
    if (!slug) continue;
    const entry = grouped.get(slug) ?? { values: [], artists: 0 };
    entry.values.push(row.country);
    entry.artists += Number(row.artists);
    grouped.set(slug, entry);
  }

  const countries = [...grouped.entries()]
    .map(([slug, e]) => ({ slug, name: displayCountryName(e.values), artists: e.artists }))
    .sort((a, b) => b.artists - a.artists || a.name.localeCompare(b.name));

  const total = countries.reduce((sum, c) => sum + c.artists, 0);

  return (
    <SiteLayout title="aRTISTS bY cOUNTRY">
      <div className="container-fluid bg-secondary apb-1 ap-1" style={{ marginBottom: "16px" }}>
        <div className="col-lg-12 p-0 lightgrey" style={{ height: "16px", lineHeight: "16px", marginBottom: "16px" }}>
          {total} artists across {countries.length} countries
        </div>
        {countries.length === 0 && <div className="lightgrey">No countries recorded yet.</div>}
        {countries.map(c => (
          <div
            key={c.slug}
            className="col-lg-12 p-0 d-flex"
            style={{ gap: "16px", height: "16px", lineHeight: "16px", marginBottom: "8px" }}
          >
            <ContentLink href={`/country/${c.slug}`} className="magenta" style={{ minWidth: "320px", fontFamily: "TopazPlus_a1200, monospace" }}>
              {c.name}
            </ContentLink>
            <span className="lightgrey" style={{ minWidth: "96px" }}>
              {c.artists} artist{c.artists === 1 ? "" : "s"}
            </span>
          </div>
        ))}
      </div>
    </SiteLayout>
  );
}
