import { Suspense } from "react";
import { getHiddenWidgets } from "@/lib/widgets";
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
  const hidden = await getHiddenWidgets();
  return (
    <>
      {!hidden.has("top_collys") && <Suspense><TopCollys /></Suspense>}
      {!hidden.has("most_viewed_collys") && <Suspense><MostViewedCollys /></Suspense>}
      {!hidden.has("top_artists") && <Suspense><TopArtists /></Suspense>}
      {!hidden.has("top_crews") && <Suspense><TopCrews /></Suspense>}
      {!hidden.has("top_uploaders") && <Suspense><TopUploaders /></Suspense>}
      {!hidden.has("top_commenters") && <Suspense><TopCommenters /></Suspense>}
      {!hidden.has("top_taggers") && <Suspense><TopTaggers /></Suspense>}
      {!hidden.has("arena_stats") && <Suspense><ArenaStats /></Suspense>}
      {!hidden.has("bbs_weektop") && <Suspense><BBSWeektop /></Suspense>}
    </>
  );
}
