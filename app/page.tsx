import SiteLayout from "@/components/layout/SiteLayout";
import LatestReleases from "@/components/widgets/home/LatestReleases";
import LatestComments from "@/components/widgets/home/LatestComments";
import SiteWall from "@/components/widgets/home/SiteWall";
import GlobalWall from "@/components/widgets/home/GlobalWall";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <SiteLayout title={["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"]}>
      <LatestReleases columns={2} header="LATEST RELEASES" />
      <LatestReleases columns={2} random header="RANDOM RELEASES" />
      <LatestComments />
      <SiteWall isLoggedIn={isLoggedIn} />
      <GlobalWall />
    </SiteLayout>
  );
}
