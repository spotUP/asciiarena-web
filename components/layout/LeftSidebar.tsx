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
      <Suspense><UsersOnline /></Suspense>
      <Suspense><LastCallers limit={5} /></Suspense>
      <Suspense><LatestCollys type="released" limit={8} /></Suspense>
      <Suspense><LatestCollys type="added" limit={5} /></Suspense>
      <Suspense><LatestMags limit={5} /></Suspense>
      <Suspense><LatestApps limit={5} /></Suspense>
      <Suspense><NewUsers /></Suspense>
      <Suspense><Weektop /></Suspense>
    </>
  );
}
