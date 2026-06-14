import LatestReleasesStatic from "./LatestReleasesStatic";

// Both hero variants render server-side. An earlier version used a
// client-fetching LatestReleasesLive for the non-random "LATEST RELEASES"
// hero, but it rendered empty in the SSR HTML and then popped in the tall
// ASCII art on hydration -- the single biggest source of layout shift on
// the home page (it pushed every widget below it down). Server-rendering
// puts the art in the first paint (zero CLS); the backInUp entrance is a
// transform, so it animates without shifting layout. The DB query is cached
// 60s (see LatestReleasesStatic), so this stays cheap.
export default function LatestReleases({ columns = 2, random = false, header = "LATEST RELEASES" }: {
  columns?: number;
  random?: boolean;
  header?: string;
}) {
  return <LatestReleasesStatic columns={columns} random={random} header={header} />;
}
