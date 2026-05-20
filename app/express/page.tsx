import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import SiteLayout from "@/components/layout/SiteLayout";
import TopArtists from "@/components/widgets/TopArtists";
import TopCollys from "@/components/widgets/TopCollys";
import TopCrews from "@/components/widgets/TopCrews";
import TopUploaders from "@/components/widgets/TopUploaders";
import TopCommenters from "@/components/widgets/TopCommenters";
import MostViewedCollys from "@/components/widgets/MostViewedCollys";

export default async function ExpressPage() {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") notFound();

  return (
    <SiteLayout title="eXPRESS">
      <div className="row">
        <div className="col-lg-6 p-0 pr-lg-2">
          <TopArtists limit={25} />
        </div>
        <div className="col-lg-6 p-0 pl-lg-2">
          <TopCrews limit={25} />
        </div>
      </div>
      <div className="row apt-1">
        <div className="col-lg-6 p-0 pr-lg-2">
          <TopCollys limit={25} />
        </div>
        <div className="col-lg-6 p-0 pl-lg-2">
          <MostViewedCollys limit={25} />
        </div>
      </div>
      <div className="row apt-1">
        <div className="col-lg-6 p-0 pr-lg-2">
          <TopUploaders limit={25} />
        </div>
        <div className="col-lg-6 p-0 pl-lg-2">
          <TopCommenters limit={25} />
        </div>
      </div>
    </SiteLayout>
  );
}
