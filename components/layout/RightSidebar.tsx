import TopCollys from "@/components/widgets/TopCollys";
import MostViewedCollys from "@/components/widgets/MostViewedCollys";
import TopArtists from "@/components/widgets/TopArtists";
import TopCrews from "@/components/widgets/TopCrews";
import TopUploaders from "@/components/widgets/TopUploaders";
import TopCommenters from "@/components/widgets/TopCommenters";
import ArenaStats from "@/components/widgets/ArenaStats";
import BBSWeektop from "@/components/widgets/BBSWeektop";

export default function RightSidebar() {
  return (
    <>
      <TopCollys />
      <MostViewedCollys />
      <TopArtists />
      <TopCrews />
      <TopUploaders />
      <TopCommenters />
      <ArenaStats />
      <BBSWeektop />
    </>
  );
}
