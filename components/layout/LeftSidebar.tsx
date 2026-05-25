import { Suspense } from "react";
import UsersOnline from "@/components/widgets/UsersOnline";
import LastCallers from "@/components/widgets/LastCallers";
import LatestCollys from "@/components/widgets/LatestCollys";
import LatestMags from "@/components/widgets/LatestMags";
import LatestApps from "@/components/widgets/LatestApps";
import NewUsers from "@/components/widgets/NewUsers";
import Weektop from "@/components/widgets/Weektop";

export default function LeftSidebar() {
  return (
    <>
      <Suspense fallback={null}><UsersOnline /></Suspense>
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
