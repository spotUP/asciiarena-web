import { Suspense } from "react";
import SiteLayout from "@/components/layout/SiteLayout";
import LatestReleases from "@/components/widgets/home/LatestReleases";
import LatestComments from "@/components/widgets/home/LatestComments";
import SiteWall from "@/components/widgets/home/SiteWall";
import GlobalWall from "@/components/widgets/home/GlobalWall";
import RecentlyViewed from "@/components/widgets/RecentlyViewed";
import PollHero from "@/components/widgets/PollHero";
import ActivityFeed from "@/components/widgets/ActivityFeed";
import Hideable from "@/components/widgets/Hideable";
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
      {/* Top of the middle column: ambient "who is doing what" that used to
          arrive as bell notifications. Live over SSE, and the /api/live route
          backfills recent events on connect so it is never an empty box. */}
      {!hidden.has("activity_feed")    && <Hideable widgetKey="activity_feed" canHide={isLoggedIn}><ActivityFeed /></Hideable>}
      {!hidden.has("poll_hero")        && <Hideable widgetKey="poll_hero" canHide={isLoggedIn}><Suspense fallback={null}><PollHero /></Suspense></Hideable>}
      {!hidden.has("latest_releases")  && <Hideable widgetKey="latest_releases" canHide={isLoggedIn}><Suspense fallback={null}><LatestReleases columns={2} header="LATEST RELEASES" /></Suspense></Hideable>}
      {!hidden.has("random_releases")  && <Hideable widgetKey="random_releases" canHide={isLoggedIn}><Suspense fallback={null}><LatestReleases columns={2} random header="RANDOM RELEASES" /></Suspense></Hideable>}
      {!hidden.has("latest_comments")  && <Hideable widgetKey="latest_comments" canHide={isLoggedIn}><Suspense fallback={null}><LatestComments /></Suspense></Hideable>}
      {!hidden.has("recently_viewed")  && <Hideable widgetKey="recently_viewed" canHide={isLoggedIn}><Suspense fallback={null}><RecentlyViewed /></Suspense></Hideable>}
      {!hidden.has("wall")             && <Hideable widgetKey="wall" canHide={isLoggedIn}><Suspense fallback={null}><SiteWall isLoggedIn={isLoggedIn} /></Suspense></Hideable>}
      {!hidden.has("global_wall")      && <Hideable widgetKey="global_wall" canHide={isLoggedIn}><Suspense fallback={null}><GlobalWall isLoggedIn={isLoggedIn} /></Suspense></Hideable>}
    </SiteLayout>
  );
}
