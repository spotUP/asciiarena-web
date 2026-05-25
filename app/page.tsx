import SiteLayout from "@/components/layout/SiteLayout";
import LatestReleases from "@/components/widgets/home/LatestReleases";
import LatestComments from "@/components/widgets/home/LatestComments";
import SiteWall from "@/components/widgets/home/SiteWall";
import GlobalWall from "@/components/widgets/home/GlobalWall";
import RecentlyViewed from "@/components/widgets/RecentlyViewed";
import { getSession as auth } from "@/lib/session";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <SiteLayout title={["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"]}>
      <LatestReleases columns={2} header="LATEST RELEASES" />
      <LatestReleases columns={2} random header="RANDOM RELEASES" />
      <LatestComments />
      <RecentlyViewed />
      <SiteWall isLoggedIn={isLoggedIn} />
      <GlobalWall isLoggedIn={isLoggedIn} />
    </SiteLayout>
  );
}
