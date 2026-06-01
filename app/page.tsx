import { Suspense } from "react";
import SiteLayout from "@/components/layout/SiteLayout";
import LatestReleases from "@/components/widgets/home/LatestReleases";
import LatestComments from "@/components/widgets/home/LatestComments";
import SiteWall from "@/components/widgets/home/SiteWall";
import GlobalWall from "@/components/widgets/home/GlobalWall";
import RecentlyViewed from "@/components/widgets/RecentlyViewed";
import PollHero from "@/components/widgets/PollHero";
import { getSession as auth } from "@/lib/session";
import { getHiddenWidgets } from "@/lib/widgets";

// Every widget is wrapped in <Suspense> so they each stream into the
// response independently instead of one slow widget delaying the whole
// page. The hidden-widget check inside each widget short-circuits to
// null without a wrapper element so layout doesn't shift around them.
export default async function HomePage() {
  const [session, hidden] = await Promise.all([
    auth().catch(() => null),
    getHiddenWidgets(),
  ]);
  const isLoggedIn = !!session?.user;

  return (
    <SiteLayout title={["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"]}>
      {!hidden.has("poll_hero")        && <Suspense fallback={null}><PollHero /></Suspense>}
      {!hidden.has("latest_releases")  && <Suspense fallback={null}><LatestReleases columns={2} header="LATEST RELEASES" /></Suspense>}
      {!hidden.has("random_releases")  && <Suspense fallback={null}><LatestReleases columns={2} random header="RANDOM RELEASES" /></Suspense>}
      {!hidden.has("latest_comments")  && <Suspense fallback={null}><LatestComments /></Suspense>}
      {!hidden.has("recently_viewed")  && <Suspense fallback={null}><RecentlyViewed /></Suspense>}
      {!hidden.has("wall")             && <Suspense fallback={null}><SiteWall isLoggedIn={isLoggedIn} /></Suspense>}
      {!hidden.has("global_wall")      && <Suspense fallback={null}><GlobalWall isLoggedIn={isLoggedIn} /></Suspense>}
    </SiteLayout>
  );
}
