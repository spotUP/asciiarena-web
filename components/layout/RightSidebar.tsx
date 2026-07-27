import { Suspense } from "react";
import { getSession as auth } from "@/lib/session";
import { getHiddenWidgets } from "@/lib/widgets";
import Hideable from "@/components/widgets/Hideable";
import TopCollys from "@/components/widgets/TopCollys";
import MostViewedCollys from "@/components/widgets/MostViewedCollys";
import TopArtists from "@/components/widgets/TopArtists";
import TopCrews from "@/components/widgets/TopCrews";
import TopUploaders from "@/components/widgets/TopUploaders";
import TopCommenters from "@/components/widgets/TopCommenters";
import TopTaggers from "@/components/widgets/TopTaggers";
import ArenaStats from "@/components/widgets/ArenaStats";
import BBSWeektop from "@/components/widgets/BBSWeektop";

export default async function RightSidebar() {
  const session = await auth().catch(() => null);
  // Anonymous visitors have nowhere to store the preference, so no [X].
  const canHide = !!(session as { user?: { id?: string } } | null)?.user?.id;
  const hidden = await getHiddenWidgets();
  return (
    <>
      {!hidden.has("top_collys") && <Hideable widgetKey="top_collys" canHide={canHide}><Suspense><TopCollys /></Suspense></Hideable>}
      {!hidden.has("most_viewed_collys") && <Hideable widgetKey="most_viewed_collys" canHide={canHide}><Suspense><MostViewedCollys /></Suspense></Hideable>}
      {!hidden.has("top_artists") && <Hideable widgetKey="top_artists" canHide={canHide}><Suspense><TopArtists /></Suspense></Hideable>}
      {!hidden.has("top_crews") && <Hideable widgetKey="top_crews" canHide={canHide}><Suspense><TopCrews /></Suspense></Hideable>}
      {!hidden.has("top_uploaders") && <Hideable widgetKey="top_uploaders" canHide={canHide}><Suspense><TopUploaders /></Suspense></Hideable>}
      {!hidden.has("top_commenters") && <Hideable widgetKey="top_commenters" canHide={canHide}><Suspense><TopCommenters /></Suspense></Hideable>}
      {!hidden.has("top_taggers") && <Hideable widgetKey="top_taggers" canHide={canHide}><Suspense><TopTaggers /></Suspense></Hideable>}
      {!hidden.has("arena_stats") && <Hideable widgetKey="arena_stats" canHide={canHide}><Suspense><ArenaStats /></Suspense></Hideable>}
      {!hidden.has("bbs_weektop") && <Hideable widgetKey="bbs_weektop" canHide={canHide}><Suspense><BBSWeektop /></Suspense></Hideable>}
    </>
  );
}
