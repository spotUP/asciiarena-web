import type { Metadata } from "next";
import SiteLayout from "@/components/layout/SiteLayout";

export const metadata: Metadata = {
  title: "API Docs | aSCIIaRENA",
  description: "Public read-only API for chatbots and scripts. No key required.",
};

const GROUPS: { title: string; rows: { method: string; path: string; desc: string }[] }[] = [
  {
    title: "START HERE",
    rows: [
      { method: "GET", path: "/api/v1/status", desc: "Health, version, full endpoint index" },
      { method: "GET", path: "/api/v1/openapi", desc: "OpenAPI 3.1 JSON spec for codegen" },
      { method: "GET", path: "/api/v1/stats", desc: "Archive totals (collys, logos, artists...)" },
      { method: "GET", path: "/api/v1/search?q=spot", desc: "One call: top collys, logos, artists, crews" },
    ],
  },
  {
    title: "COLLECTIONS",
    rows: [
      { method: "GET", path: "/api/v1/collys?q=&artist=&crew=&year=&type=&sort=&order=&page=&per_page=", desc: "List collys. Up to 100 per page" },
      { method: "GET", path: "/api/v1/collys/:id", desc: "Detail by numeric id OR filename" },
      { method: "GET", path: "/api/v1/collys/:id/text", desc: "Full decoded plaintext of the colly" },
      { method: "GET", path: "/api/v1/collys/:id/comments", desc: "Comments on one colly" },
    ],
  },
  {
    title: "INDIVIDUAL LOGOS (TAGGED INSIDE COLLIES)",
    rows: [
      { method: "GET", path: "/api/v1/collys/:id/logos", desc: "Every logo in one release, each with ASCII text" },
      { method: "GET", path: "/api/v1/logos?q=&artist=&crew=&artist_id=&crew_id=&colly_id=&manual=", desc: "Search all logos. Example: ?artist=spot" },
      { method: "GET", path: "/api/v1/logos/:id", desc: "One logo with ASCII text + deep link" },
    ],
  },
  {
    title: "LOGO WALL",
    rows: [
      { method: "GET", path: "/api/v1/site-logos?author=&kind=&q=", desc: "Standalone logos (kind ascii|ansi). List returns preview" },
      { method: "GET", path: "/api/v1/site-logos/:id", desc: "One logo with full text" },
    ],
  },
  {
    title: "SCENE DIRECTORY",
    rows: [
      { method: "GET", path: "/api/v1/artists?q=&sort=nick|rating", desc: "List artists with colly + logo counts" },
      { method: "GET", path: "/api/v1/artists/:id", desc: "Artist by id OR nick, with releases" },
      { method: "GET", path: "/api/v1/crews?q=&sort=name|rating", desc: "List crews with member + release counts" },
      { method: "GET", path: "/api/v1/crews/:id", desc: "Crew by id OR name, with members + releases" },
      { method: "GET", path: "/api/v1/mags?q=", desc: "List mags" },
      { method: "GET", path: "/api/v1/apps?q=", desc: "List apps" },
      { method: "GET", path: "/api/v1/bbs?q=", desc: "List BBSes" },
      { method: "GET", path: "/api/v1/requests?q=&status=", desc: "List requests (status 0 open, 1 filled, 2 denied)" },
      { method: "GET", path: "/api/v1/requests/:id", desc: "Request with comments" },
      { method: "GET", path: "/api/v1/comments?colly_id=", desc: "Latest comments, optional colly filter" },
    ],
  },
  {
    title: "LEADERBOARDS + WIDGETS",
    rows: [
      { method: "GET", path: "/api/v1/tops?limit=", desc: "Top uploaders, commenters, taggers in one call" },
      { method: "GET", path: "/api/v1/news?q=", desc: "Published site news" },
      { method: "GET", path: "/api/v1/news/:id", desc: "One news item with body" },
      { method: "GET", path: "/api/v1/polls?status=", desc: "Open + closed polls (status open|closed)" },
      { method: "GET", path: "/api/v1/polls/:slug", desc: "Poll with options + results when public" },
      { method: "GET", path: "/api/v1/walls", desc: "Wall boards with post counts" },
      { method: "GET", path: "/api/v1/walls/:id", desc: "Wall with latest 13 tags" },
      { method: "GET", path: "/api/v1/online", desc: "Users online now + anonymous count" },
      { method: "GET", path: "/api/v1/new-users?limit=", desc: "Newest members" },
      { method: "GET", path: "/api/v1/last-callers?limit=", desc: "Recently active users" },
      { method: "GET", path: "/api/v1/forum?limit=", desc: "Latest public forum posts" },
      { method: "GET", path: "/api/v1/weektop?source=", desc: "BBS weektop (source uploaders|bbs|globalwall)" },
    ],
  },
];

export default function ApiDocsPage() {
  return (
    <SiteLayout title="API">
      <div className="container-fluid apb-1">
        <div className="row apt-1">
          <div className="col-lg-12">
            <h2 className="ap-1 bg-header">BOT API V1</h2>
          </div>
        </div>
        <div className="col-lg-12 apt-1">
          <p>
            <span className="white">Public, read-only, no key required. </span>
            <span className="cyan">120 requests/minute per IP. </span>
            <span className="white">Lists return </span>
            <span className="cyan">{"{ data, meta: { page, per_page, total, total_pages } }"}</span>
            <span className="white">. CORS open (*), so browser bots can fetch directly.</span>
          </p>
          <p>
            <span className="white">Machine spec: </span>
            <a href="/api/v1/openapi">/api/v1/openapi</a>
            <span className="white"> (OpenAPI 3.1 JSON)</span>
          </p>
          <pre>
{`# all logos by one artist (paged)
curl "https://asciiarena.se/api/v1/logos?artist=spot&per_page=100"

# every logo in one release, each with its ASCII text
curl "https://asciiarena.se/api/v1/collys/123/logos"

# one logo with deep link back to the viewer
curl "https://asciiarena.se/api/v1/logos/456"`}
          </pre>
        </div>
        {GROUPS.map((g) => (
          <div key={g.title}>
            <div className="row apt-1">
              <div className="col-lg-12">
                <h2 className="ap-1 bg-header">{g.title}</h2>
              </div>
            </div>
            <div className="col-lg-12 apt-1">
              <table className="table">
                <tbody>
                  {g.rows.map((r) => (
                    <tr key={r.path}>
                      <td><span className="cyan">{r.method}</span></td>
                      <td><a href={r.path.split("?")[0].replace(":id", "1") + (r.path.includes("?") ? "?" + r.path.split("?")[1].split("&")[0] : "")}>{r.path}</a></td>
                      <td><span className="white">{r.desc}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </SiteLayout>
  );
}
