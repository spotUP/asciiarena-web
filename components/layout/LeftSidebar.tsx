import { Suspense } from "react";
import { getSession as auth } from "@/lib/session";
import UsersOnlineLive from "@/components/widgets/UsersOnlineLive";
import CedSessions from "@/components/widgets/CedSessions";
import ActivityFeed from "@/components/widgets/ActivityFeed";
import LastCallers from "@/components/widgets/LastCallers";
import LatestCollys from "@/components/widgets/LatestCollys";
import LatestMags from "@/components/widgets/LatestMags";
import LatestApps from "@/components/widgets/LatestApps";
import NewUsers from "@/components/widgets/NewUsers";
import Weektop from "@/components/widgets/Weektop";

export default async function LeftSidebar() {
  const session = await auth().catch(() => null);
  const isLoggedIn = !!(session as { user?: unknown } | null)?.user;
  return (
    <>
      <UsersOnlineLive isLoggedIn={isLoggedIn} />
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
