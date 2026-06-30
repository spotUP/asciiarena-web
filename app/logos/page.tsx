import Link from "next/link";
import SiteLayout from "@/components/layout/SiteLayout";
import { logoOfTheDay, galleryLogos, type GalleryLogo } from "@/lib/collyLogoGallery";

export const dynamic = "force-dynamic";

// Stable day seed (UTC YYYYMMDD) so "logo of the day" is consistent within a day.
function daySeed(): number {
  const d = new Date();
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

function Snippet({ logo, big = false }: { logo: GalleryLogo; big?: boolean }) {
  return (
    <Link href={`/release/${logo.filename}#logo-${logo.line}`} style={{ display: "block", textDecoration: "none" }}>
      <pre
        style={{
          fontFamily: "TopazPlus_a1200, monospace",
          fontSize: big ? "16px" : "13px",
          lineHeight: "1",
          whiteSpace: "pre",
          overflow: "hidden",
          color: "#cccccc",
          background: "#111111",
          border: "1px solid #333333",
          padding: "8px",
          margin: 0,
          maxHeight: big ? "400px" : "200px",
        }}
      >
        {logo.snippet.join("\n")}
      </pre>
    </Link>
  );
}

function Caption({ logo }: { logo: GalleryLogo }) {
  return (
    <div className="lightgrey" style={{ fontSize: "0.85em", marginTop: "4px" }}>
      <span className="white">{logo.label}</span>
      {logo.entity && (
        <>
          {" "}by <Link className={logo.entity.kind === "artist" ? "green" : "magenta"} href={logo.entity.url}>{logo.entity.name}</Link>
        </>
      )}
      {" — "}
      <Link className="magenta" href={`/release/${logo.filename}#logo-${logo.line}`}>{logo.collyName ?? logo.filename}</Link>
    </div>
  );
}

export default async function LogosPage({ searchParams }: { searchParams: Promise<{ seed?: string }> }) {
  const { seed: seedParam } = await searchParams;
  const seed = Number.isFinite(Number(seedParam)) && seedParam ? Number(seedParam) : daySeed();

  const [featured, grid] = await Promise.all([
    logoOfTheDay(daySeed()),
    galleryLogos(24, seed),
  ]);

  // Drop the featured logo from the grid so it isn't shown twice.
  const gridLogos = grid.filter((g) => !(featured && g.filename === featured.filename && g.line === featured.line));

  return (
    <SiteLayout title="LOGOS">
      {!featured && grid.length === 0 ? (
        <div className="col-12 lightgrey">No logos catalogued yet.</div>
      ) : (
        <>
          {featured && (
            <div className="amb-2">
              <div className="header col-lg-12 p-0 amb-1">
                <h2 className="ap-1 bg-header">LOGO OF THE DAY</h2>
              </div>
              <Snippet logo={featured} big />
              <Caption logo={featured} />
            </div>
          )}

          <div className="header col-lg-12 p-0 amb-1" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="ap-1 bg-header" style={{ margin: 0 }}>BROWSE LOGOS</h2>
            <Link href={`/logos?seed=${seed + 1}`} className="btn-secondary apr-1">Shuffle</Link>
          </div>

          <div className="row m-0 p-0">
            {gridLogos.map((logo) => (
              <div key={`${logo.filename}-${logo.line}`} className="col-12 col-lg-6 pl-0 pr-lg-2 amb-2">
                <Snippet logo={logo} />
                <Caption logo={logo} />
              </div>
            ))}
          </div>
        </>
      )}
    </SiteLayout>
  );
}
