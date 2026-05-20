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
      <UsersOnline />
      <LastCallers limit={5} />
      <LatestCollys type="released" limit={8} />
      <LatestCollys type="added" limit={5} />
      <LatestMags limit={5} />
      <LatestApps limit={5} />
      <NewUsers />
      <Weektop />
    </>
  );
}
