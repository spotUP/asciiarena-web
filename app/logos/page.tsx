import Link from "next/link";
import ContentLink from "@/components/ui/ContentLink";
import SiteLayout from "@/components/layout/SiteLayout";
import { logoOfTheDay, galleryLogos, type GalleryLogo } from "@/lib/collyLogoGallery";

export const dynamic = "force-dynamic";

// Stable day seed (UTC YYYYMMDD) so "logo of the day" is consistent within a day.
function daySeed(): number {
  const d = new Date();
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

// The art scales to fit its card width via container-query units: Topaz is an
// 8x16 cell (char width = half the font size), so `cols` chars fit the card when
// fontSize = 200cqw / cols, capped at the native 16px. Wide logos shrink to fit
// (never cut, no horizontal scrollbar); narrow ones stay 16px and centre.
function Snippet({ logo, height }: { logo: GalleryLogo; height: number }) {
  const cols = logo.snippet.reduce((m, l) => Math.max(m, l.length), 1);
  const fs = `min(16px, calc(200cqw / ${cols}))`;
  // Flex centres the art both axes; "safe" falls back to start-alignment when the
  // art is bigger than the card so the top/left is never clipped (it scrolls).
  const artStyle: React.CSSProperties = {
    containerType: "inline-size",
    height,
    display: "flex",
    alignItems: "safe center",
    justifyContent: "safe center",
    overflow: "auto",
    background: "#0a0a0a",
  };
  return (
    <ContentLink href={`/release/${logo.filename}#logo-${logo.line}`} style={{ display: "block", textDecoration: "none" }}>
      <div style={artStyle}>
        <pre
          style={{
            margin: 0,
            fontFamily: "TopazPlus_a1200, monospace",
            fontSize: fs,
            lineHeight: fs,
            whiteSpace: "pre",
            color: "#cccccc",
          }}
        >
          {logo.snippet.join("\n")}
        </pre>
      </div>
    </ContentLink>
  );
}

function Caption({ logo }: { logo: GalleryLogo }) {
  return (
    <div className="ap-1 lightgrey" style={{ fontSize: "0.9em" }}>
      <span className="white">{logo.label}</span>
      {logo.entity && (
        <>
          {" by "}
          <ContentLink className={logo.entity.kind === "artist" ? "green" : "magenta"} href={logo.entity.url}>{logo.entity.name}</ContentLink>
        </>
      )}
      {" — "}
      <ContentLink className="magenta" href={`/release/${logo.filename}#logo-${logo.line}`}>{logo.collyName ?? logo.filename}</ContentLink>
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

  const gridLogos = grid.filter((g) => !(featured && g.filename === featured.filename && g.line === featured.line));

  return (
    <SiteLayout title="LOGOS">
      {!featured && gridLogos.length === 0 ? (
        <div className="col-12 lightgrey">No logos catalogued yet.</div>
      ) : (
        <>
          {featured && (
            <>
              <div className="header col-lg-12 p-0 amb-1">
                <h2 className="ap-1 bg-header">LOGO OF THE DAY</h2>
              </div>
              <div className="bg-secondary amb-2">
                <Snippet logo={featured} height={384} />
                <Caption logo={featured} />
              </div>
            </>
          )}

          <div className="header col-lg-12 p-0 amb-1" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="ap-1 bg-header" style={{ margin: 0, flex: 1 }}>BROWSE LOGOS</h2>
            <Link href={`/logos?seed=${seed + 1}`} className="btn-secondary ap-1">Shuffle</Link>
          </div>

          <div className="row m-0 p-0">
            {gridLogos.map((logo) => (
              <div key={`${logo.filename}-${logo.line}`} className="col-12 col-lg-6 pl-0 pr-lg-2 amb-2">
                <div className="bg-secondary">
                  <Snippet logo={logo} height={256} />
                  <Caption logo={logo} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </SiteLayout>
  );
}
