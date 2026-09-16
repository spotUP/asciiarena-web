import { getSession as auth } from "@/lib/session";
import { redirect } from "next/navigation";
import SiteLayout from "@/components/layout/SiteLayout";
import AdsClient from "./AdsClient";
import { prisma } from "@/lib/db";

export default async function AdsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; crew?: string; bbs_id?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const crews = await prisma.crews.findMany({ select: { name: true }, orderBy: { name: "asc" } });

  return (
    <SiteLayout title="BBS ADS">
      <AdsClient
        initialQ={params.q ?? ""}
        initialCrew={params.crew ?? ""}
        initialBbsId={params.bbs_id ?? ""}
        crewList={crews.map((c) => c.name).filter(Boolean)}
      />
    </SiteLayout>
  );
}
