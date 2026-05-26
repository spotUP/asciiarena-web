import SiteLayout from "@/components/layout/SiteLayout";
import LatestReleases from "@/components/widgets/home/LatestReleases";
import LatestComments from "@/components/widgets/home/LatestComments";
import SiteWall from "@/components/widgets/home/SiteWall";
import GlobalWall from "@/components/widgets/home/GlobalWall";
import RecentlyViewed from "@/components/widgets/RecentlyViewed";
import { getSession as auth } from "@/lib/session";
import { getHiddenWidgets } from "@/lib/widgets";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const hidden = await getHiddenWidgets();

  return (
    <SiteLayout title={["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"]}>
      {!hidden.has("latest_releases") && <LatestReleases columns={2} header="LATEST RELEASES" />}
      {!hidden.has("random_releases") && <LatestReleases columns={2} random header="RANDOM RELEASES" />}
      {!hidden.has("latest_comments") && <LatestComments />}
      {!hidden.has("recently_viewed") && <RecentlyViewed />}
      {!hidden.has("wall") && <SiteWall isLoggedIn={isLoggedIn} />}
      {!hidden.has("global_wall") && <GlobalWall isLoggedIn={isLoggedIn} />}
    </SiteLayout>
  );
}
