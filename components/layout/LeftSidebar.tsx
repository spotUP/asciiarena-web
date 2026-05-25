import { Suspense } from "react";
import UsersOnlineLive from "@/components/widgets/UsersOnlineLive";
import CedSessions from "@/components/widgets/CedSessions";
import ActivityFeed from "@/components/widgets/ActivityFeed";
import LastCallers from "@/components/widgets/LastCallers";
import LatestCollys from "@/components/widgets/LatestCollys";
import LatestMags from "@/components/widgets/LatestMags";
import LatestApps from "@/components/widgets/LatestApps";
import NewUsers from "@/components/widgets/NewUsers";
import Weektop from "@/components/widgets/Weektop";

export default function LeftSidebar() {
  return (
    <>
      <UsersOnlineLive />
      <ActivityFeed />
      <CedSessions />
      <Suspense fallback={null}><LastCallers limit={5} /></Suspense>
      <Suspense fallback={null}><LatestCollys type="released" limit={8} /></Suspense>
      <Suspense fallback={null}><LatestCollys type="added" limit={5} /></Suspense>
      <Suspense fallback={null}><LatestMags limit={5} /></Suspense>
      <Suspense fallback={null}><LatestApps limit={5} /></Suspense>
      <Suspense fallback={null}><NewUsers /></Suspense>
      <Suspense fallback={null}><Weektop /></Suspense>
    </>
  );
}
