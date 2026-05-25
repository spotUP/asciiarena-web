import LatestReleasesLive from "./LatestReleasesLive";
import LatestReleasesStatic from "./LatestReleasesStatic";

export default function LatestReleases({ columns = 2, random = false, header = "LATEST RELEASES" }: {
  columns?: number;
  random?: boolean;
  header?: string;
}) {
  if (random) return <LatestReleasesStatic columns={columns} random header={header} />;
  return <LatestReleasesLive columns={columns} header={header} />;
}
