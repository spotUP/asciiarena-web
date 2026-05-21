import { getSession as auth } from "@/lib/session";
import { redirect } from "next/navigation";
import SiteLayout from "@/components/layout/SiteLayout";
import SubmitClient from "./SubmitClient";
import { prisma } from "@/lib/db";

export default async function SubmitPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Pre-fetch lists for dropdowns
  const [artists, crews, bbses] = await Promise.all([
    prisma.artists.findMany({ select: { nick: true }, orderBy: { nick: "asc" } }),
    prisma.crews.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.bbses.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <SiteLayout title="SUBMIT">
      <SubmitClient
        artistList={artists.map((a) => a.nick ?? "").filter(Boolean)}
        crewList={crews.map((c) => c.name ?? "").filter(Boolean)}
        bbsList={bbses.map((b) => b.name ?? "").filter(Boolean)}
      />
    </SiteLayout>
  );
}
